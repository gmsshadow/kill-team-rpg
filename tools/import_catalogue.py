#!/usr/bin/env python3
"""
Import a New Recruit / BattleScribe catalogue into a system data file.

The catalogues at https://bsdata.net track the current state of Kill Team 2018
including errata and the Elites and Commanders expansions, which makes them a
better source than transcribing the core manual by hand - and a different data
vintage from it. Where they disagree with the printed 2018 book, the catalogue
wins, because that is the version being played.

Usage, from the system root:
    python3 tools/import_catalogue.py <path-to-.cat> [--out module/helpers/factions]

Writes one .mjs data file per faction, in the same shape as the hand-written
files, so tools/build-packs.mjs can consume it without special cases.

What is imported:
    models    - characteristics, Max, points, keywords, specialisms, wargear
    weapons   - Range, Type, S, AP, D and the abilities text
    abilities - as prose; machine-readable rules are tagged separately by hand

What is not:
    Rules tagging. Ability text becomes a `manual` rule until someone reads it
    and decides what it does. That judgement is not automatable and pretending
    otherwise would put wrong rules into the engine.
"""

import argparse
import json
import os
import re
import sys
import xml.etree.ElementTree as ET

NS = "{http://www.battlescribe.net/schema/catalogueSchema}"

# Type line to (weaponType, attacks). "Rapid Fire 1" -> ("rapidFire", "1")
TYPE_MAP = {
    "assault": "assault",
    "heavy": "heavy",
    "rapid fire": "rapidFire",
    "grenade": "grenade",
    "pistol": "pistol",
    "melee": "melee",
}


def slug(text):
    """A stable key from a name: 'Gauss flayer' -> 'gauss-flayer'."""
    return re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")


def parse_target(value):
    """'3+' -> 3, '-' -> None, '4' -> 4."""
    if value is None:
        return None
    v = value.strip().rstrip("+")
    return int(v) if v.isdigit() else None


def parse_int(value, default=0):
    if value is None:
        return default
    m = re.search(r"-?\d+", value)
    return int(m.group()) if m else default


def parse_weapon_type(type_line):
    """'Rapid Fire 1' -> ('rapidFire', '1'); 'Melee' -> ('melee', '1')."""
    line = (type_line or "").strip()
    low = line.lower()
    for prefix, key in TYPE_MAP.items():
        if low.startswith(prefix):
            rest = line[len(prefix):].strip()
            return key, (rest if rest else "1")
    return "assault", "1"


def characteristics(profile):
    return {c.get("name"): (c.text or "").strip()
            for c in profile.iter(f"{NS}characteristic")}


def collect_profiles(root, type_name):
    """Every profile of a type, keyed by name, first occurrence winning."""
    out = {}
    for p in root.iter(f"{NS}profile"):
        if p.get("typeName") == type_name and p.get("name") not in out:
            out[p.get("name")] = characteristics(p)
    return out


def entry_costs(entry):
    for c in entry.findall(f"{NS}costs/{NS}cost"):
        if c.get("name") == "pts":
            return int(float(c.get("value") or 0))
    return 0


def specialisms_from_group(node, shared=None):
    """
    Specialism options are entryLinks inside a group named 'Specialism'.

    A group may also be an entryLink pointing at a shared group by id, which is
    how the larger catalogues avoid repeating the same list on every model, so
    resolve through `shared` when one is supplied.
    """
    shared = shared or {}
    for group in node.iter(f"{NS}selectionEntryGroup"):
        if group.get("name") != "Specialism":
            continue
        names = {e.get("name") for e in group.iter(f"{NS}entryLink")}
        # Follow any link that resolves to a shared group.
        for e in group.iter(f"{NS}entryLink"):
            target = shared.get(e.get("targetId"))
            if target is not None:
                names |= {x.get("name") for x in target.iter(f"{NS}entryLink")}
                names |= {x.get("name") for x in target.iter(f"{NS}selectionEntry")}
        names.discard(None)
        names.discard("Non-specialist")
        if names:
            return sorted(names)
    # The whole group may itself be a link on the model.
    for e in node.iter(f"{NS}entryLink"):
        target = shared.get(e.get("targetId"))
        if target is not None and target.get("name") == "Specialism":
            names = {x.get("name") for x in target.iter(f"{NS}entryLink")}
            names |= {x.get("name") for x in target.iter(f"{NS}selectionEntry")}
            names.discard(None)
            names.discard("Non-specialist")
            if names:
                return sorted(names)
    return []


def index_entries(root):
    """Every selectionEntry in a catalogue, keyed by id."""
    NSE = f"{NS}selectionEntry"
    return {e.get("id"): e for e in root.iter(NSE) if e.get("id")}


def load_linked_roots(path, root):
    """The parsed roots of every catalogue this one links to."""
    directory = os.path.dirname(os.path.abspath(path))
    roots = []
    for link in root.iter(f"{NS}catalogueLink"):
        target = os.path.join(directory, f"{link.get('name')}.cat")
        if os.path.exists(target):
            roots.append(ET.parse(target).getroot())
    return roots


def load_linked_catalogues(path, root):
    """
    Load any catalogue this one links to.

    Three faction files - Adeptus Astartes, Deathwatch and Adepta Sororitas -
    hold only a faction-specific overlay for their models: which ones may be
    taken and what specialisms they get. The characteristics, weapons and
    points live in Space Marines.cat, referenced by id. Without following the
    link those models import with no stats, or are missed entirely.
    """
    directory = os.path.dirname(os.path.abspath(path))
    index = {}
    for link in root.iter(f"{NS}catalogueLink"):
        name = link.get("name")
        target = os.path.join(directory, f"{name}.cat")
        if not os.path.exists(target):
            print(f"  warning: linked catalogue '{name}' not found; "
                  f"models defined there will be skipped", file=sys.stderr)
            continue
        index.update(index_entries(ET.parse(target).getroot()))
        print(f"  linked catalogue: {name}")
    return index


def import_catalogue(path):
    root = ET.parse(path).getroot()
    faction = root.get("name")
    external = load_linked_catalogues(path, root)
    linked_roots = load_linked_roots(path, root)
    # Weapon and ability profiles are searched across the linked catalogues as
    # well, because the models that use them are defined there.
    all_roots = [root] + linked_roots

    # Rank-and-file models carry their specialisms on a catalogue-level
    # entryLink rather than inside the model entry, so collect those by name
    # and merge them in below.
    # Index every shared group by id so links can be followed.
    shared_groups = {g.get("id"): g for g in root.iter(f"{NS}selectionEntryGroup")
                     if g.get("id")}

    linked_specialisms = {}
    for link in root.iter(f"{NS}entryLink"):
        found = specialisms_from_group(link, shared_groups)
        if found:
            linked_specialisms.setdefault(link.get("name"), found)

    abilities, wargear_text = {}, {}
    for r in all_roots:
        for nm, chars in collect_profiles(r, "Ability").items():
            abilities.setdefault(nm, chars.get("Description", ""))
        for nm, chars in collect_profiles(r, "Wargear").items():
            wargear_text.setdefault(nm, chars.get("Ability", ""))

    # ---- weapons ----
    weapons, seen_weapons = [], set()
    for p in (q for r in all_roots for q in r.iter(f"{NS}profile")):
        if p.get("typeName") != "Weapon":
            continue
        name = p.get("name")
        if name in seen_weapons:
            continue
        seen_weapons.add(name)
        c = characteristics(p)
        wtype, attacks = parse_weapon_type(c.get("Type"))
        ability = c.get("Abilities", "").strip()
        weapons.append({
            "key": slug(name),
            "name": name,
            "points": 0,          # filled from the owning selection entry below
            "range": c.get("Range", "").strip(),
            "weaponType": wtype,
            "attacks": attacks,
            "strength": c.get("S", "4").strip(),
            "ap": parse_int(c.get("AP"), 0),
            "damage": c.get("D", "1").strip(),
            "abilities": "" if ability in ("-", "") else ability,
        })

    # Weapon and wargear points live on the selection entry, not the profile.
    points_by_name = {}
    for se in (q for r in all_roots for q in r.iter(f"{NS}selectionEntry")):
        cost = entry_costs(se)
        if cost:
            points_by_name[se.get("name")] = cost
    for w in weapons:
        w["points"] = points_by_name.get(w["name"], 0)

    # ---- models ----
    # Models defined here, plus models pulled in from a linked catalogue by an
    # overlay entryLink. The overlay supplies specialisms and categories; the
    # linked entry supplies the profile, weapons and points.
    candidates = [(se, None) for se in root.iter(f"{NS}selectionEntry")
                  if se.get("type") == "model"]
    for link in root.iter(f"{NS}entryLink"):
        target = external.get(link.get("targetId"))
        if target is not None and target.get("type") == "model":
            candidates.append((target, link))

    models, seen_models = [], set()
    for se, overlay in candidates:
        profile = next((p for p in se.iter(f"{NS}profile")
                        if p.get("typeName") == "Model"), None)
        if profile is None:
            continue
        name = (overlay if overlay is not None else se).get("name") or se.get("name")
        if name in seen_models:
            continue
        seen_models.add(name)
        c = characteristics(profile)

        cats = [cl.get("name") for cl in se.iter(f"{NS}categoryLink")]
        if overlay is not None:
            cats += [cl.get("name") for cl in overlay.iter(f"{NS}categoryLink")]
        cats = [c for c in cats if c and c != "New CategoryLink"]
        keywords = [k for k in cats if k not in ("Model",) and not k.startswith("Faction:")]
        faction_cat = next((k[len("Faction:"):].strip() for k in cats
                            if k.startswith("Faction:")), faction)

        model_abilities = []
        for link in se.iter(f"{NS}infoLink"):
            text = abilities.get(link.get("name"))
            if text:
                model_abilities.append(f"{link.get('name')}: {text}")

        options = sorted({e.get("name") for e in se.iter(f"{NS}selectionEntry")
                          if e.get("type") == "upgrade" and e.get("name")})

        # Specialisms are a named group whose members are entryLinks, not
        # selectionEntries. Commander specialisms (Fortitude, Logistics,
        # Strategist and so on) come from the Commanders expansion and sit
        # alongside the ten core ones, so both are kept as written.
        # The overlay is the authority on specialisms: the same model may be
        # allowed different ones in different factions.
        specialisms = []
        if overlay is not None:
            specialisms = specialisms_from_group(overlay, shared_groups)
        if not specialisms:
            specialisms = (specialisms_from_group(se, shared_groups)
                           or linked_specialisms.get(name, []))

        # Commander specialisms come from the Commanders expansion. A model
        # offering them is a Commander even where the category is absent.
        COMMANDER_SPECIALISMS = {"Fortitude", "Logistics", "Melee", "Shooting",
                                 "Strategist", "Strength", "Leadership"}
        is_commander = "Commander" in cats or bool(set(specialisms) & COMMANDER_SPECIALISMS)

        models.append({
            "key": slug(name),
            "name": name,
            "points": entry_costs(se),
            "maxNumber": c.get("Max", "-") or "-",
            "profile": {
                "move": c.get("M", '6"'),
                "ws": parse_target(c.get("WS")) or 4,
                "bs": parse_target(c.get("BS")) or 4,
                "strength": parse_int(c.get("S"), 3),
                "toughness": parse_int(c.get("T"), 3),
                "wounds": parse_int(c.get("W"), 1),
                "attacks": parse_int(c.get("A"), 1),
                "ld": parse_int(c.get("Ld"), 6),
                "save": parse_target(c.get("Sv")) or 5,
            },
            "keywords": ", ".join([faction_cat] + keywords),
            "wargear": "; ".join(options),
            "specialisms": specialisms,
            "commander": is_commander,
            "abilities": model_abilities,
        })

    models.sort(key=lambda m: m["name"])
    weapons.sort(key=lambda w: (w["weaponType"] == "melee", w["name"]))
    return faction, models, weapons, wargear_text


def js_literal(value, indent=0):
    """Render Python data as readable JS, so the output is reviewable."""
    pad = "  " * indent
    if isinstance(value, str):
        return json.dumps(value)
    if isinstance(value, bool):
        return "true" if value else "false"
    if value is None:
        return "null"
    if isinstance(value, (int, float)):
        return str(value)
    if isinstance(value, list):
        if not value:
            return "[]"
        inner = ",\n".join(f"{pad}  {js_literal(v, indent + 1)}" for v in value)
        return "[\n" + inner + f"\n{pad}]"
    if isinstance(value, dict):
        inner = ", ".join(f"{k}: {js_literal(v, indent + 1)}" for k, v in value.items())
        return "{ " + inner + " }"
    raise TypeError(type(value))


def write_module(faction, models, weapons, out_dir):
    key = slug(faction)
    lines = [
        "/**",
        f" * {faction}.",
        " *",
        " * Generated by tools/import_catalogue.py from the New Recruit catalogue,",
        " * which tracks Kill Team 2018 including errata and the Elites and Commanders",
        " * expansions. Do not hand-edit: re-run the importer instead.",
        " *",
        f" * {len(models)} models, {len(weapons)} weapons.",
        " *",
        " * Ability text is imported as prose. Machine-readable rules are tagged",
        " * separately, by hand, in module/rules/ - deciding what an ability does is a",
        " * judgement call and is not safe to automate.",
        " */",
        "",
        f"export const {key.upper().replace('-', '_')}_WEAPONS = "
        + js_literal(weapons) + ";",
        "",
        f"export const {key.upper().replace('-', '_')}_MODELS = "
        + js_literal(models) + ";",
        "",
        f'const FACTION = {json.dumps(faction)};',
        "",
        f"export const {key.upper().replace('-', '_')}_ITEMS = "
        f"{key.upper().replace('-', '_')}_WEAPONS"
        '.map(w => ({ ...w, itemType: "weapon", faction: FACTION }));',
        "",
        f"export const {key.upper().replace('-', '_')}_MODEL_ITEMS = "
        f"{key.upper().replace('-', '_')}_MODELS"
        '.map(m => ({ ...m, itemType: "model", faction: FACTION, rules: [] }));',
        "",
    ]
    os.makedirs(out_dir, exist_ok=True)
    path = os.path.join(out_dir, f"{key}.mjs")
    with open(path, "w", encoding="utf8") as fh:
        fh.write("\n".join(lines))
    return path


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("catalogue", help="Path to a .cat file")
    ap.add_argument("--out", default="module/helpers/factions")
    args = ap.parse_args()

    faction, models, weapons, _ = import_catalogue(args.catalogue)
    path = write_module(faction, models, weapons, args.out)
    print(f"{faction}: {len(models)} models, {len(weapons)} weapons -> {path}")


if __name__ == "__main__":
    main()
