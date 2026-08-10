#!/usr/bin/env python3
"""Regenerate the /card/ assets: the downloadable vCard and its QR code.

Run after changing any contact detail or the profile photo:

    python3 -m venv /tmp/qrenv && /tmp/qrenv/bin/pip install segno
    /tmp/qrenv/bin/python bin/build_card_assets.py

Writes assets/card/soroush-omidvartehrani.vcf and assets/img/card-qr.svg.
"""

import base64
import pathlib
import subprocess
import tempfile

import segno

ROOT = pathlib.Path(__file__).resolve().parent.parent

SITE_URL = "https://soroushomidvar.com"
CARD_URL = f"{SITE_URL}/card/"
PHOTO_SRC = ROOT / "assets" / "img" / "prof_pic.jpg"
VCF_OUT = ROOT / "assets" / "card" / "soroush-omidvartehrani.vcf"
QR_OUT = ROOT / "assets" / "img" / "card-qr.svg"

# Size the embedded photo down so the .vcf stays small enough to stay snappy
# over conference wifi. 240px is plenty for a contact-card avatar.
PHOTO_PX = 240


def escape(value):
    """Escape a vCard TEXT value (RFC 2426 sec. 2)."""
    return (
        value.replace("\\", "\\\\")
        .replace(";", "\\;")
        .replace(",", "\\,")
        .replace("\n", "\\n")
    )


def fold(line):
    """Fold a content line to 75 octets, continuations prefixed with a space."""
    raw = line.encode("utf-8")
    if len(raw) <= 75:
        return line
    chunks = [raw[:75]]
    rest = raw[75:]
    while rest:
        chunks.append(rest[:74])
        rest = rest[74:]
    head = chunks[0].decode("utf-8")
    tail = ["".join((" ", c.decode("utf-8"))) for c in chunks[1:]]
    return "\r\n".join([head] + tail)


def photo_b64():
    """Downscale the profile photo with sips and return it base64-encoded."""
    with tempfile.TemporaryDirectory() as tmp:
        small = pathlib.Path(tmp) / "photo.jpg"
        subprocess.run(
            ["sips", "-Z", str(PHOTO_PX), str(PHOTO_SRC), "--out", str(small)],
            check=True,
            capture_output=True,
        )
        return base64.b64encode(small.read_bytes()).decode("ascii")


def build_vcard():
    lines = [
        "BEGIN:VCARD",
        "VERSION:3.0",
        "N:Omidvartehrani;Soroush;;;",
        "FN:Soroush Omidvartehrani",
        "NICKNAME:Soroush",
        f"TITLE:{escape('Ph.D. Candidate, Computing Science')}",
        f"ORG:{escape('University of Alberta')};{escape('Department of Computing Science')}",
        "EMAIL;type=INTERNET;type=WORK;type=pref:s.omidvartehrani@ualberta.ca",
        f"URL;type=pref:{SITE_URL}",
        "URL:https://scholar.google.com/citations?user=Nv4Sc0QAAAAJ",
        "URL:https://github.com/soroushomidvar",
        "URL:https://www.linkedin.com/in/soroushomidvar",
        "URL:https://orcid.org/0000-0002-3390-5194",
        "X-SOCIALPROFILE;type=linkedin:https://www.linkedin.com/in/soroushomidvar",
        "X-SOCIALPROFILE;type=github:https://github.com/soroushomidvar",
        f"NOTE:{escape('Researching example-driven data wrangling: automating data transformation and missing-value imputation from a handful of examples.')}",
        f"PHOTO;ENCODING=b;TYPE=JPEG:{photo_b64()}",
        "END:VCARD",
    ]
    return "\r\n".join(fold(line) for line in lines) + "\r\n"


def build_qr_svg():
    """Emit a viewBox-based SVG so CSS can scale it freely.

    Rendered dark-on-white unconditionally: a QR needs guaranteed contrast to
    stay scannable, so the card gives it a white tile in both themes.
    """
    qr = segno.make(CARD_URL, error="q")
    matrix = [list(row) for row in qr.matrix]
    size = len(matrix)
    quiet = 4
    span = size + quiet * 2

    # One path for every dark module; far smaller than one <rect> per module.
    parts = []
    for y, row in enumerate(matrix):
        for x, module in enumerate(row):
            if module:
                parts.append(f"M{x + quiet} {y + quiet}h1v1h-1z")

    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {span} {span}" '
        f'shape-rendering="crispEdges" role="img" '
        f'aria-label="QR code linking to {CARD_URL}">'
        f'<rect width="{span}" height="{span}" fill="#ffffff"/>'
        f'<path fill="#000000" d="{"".join(parts)}"/>'
        f"</svg>\n"
    )


def main():
    VCF_OUT.parent.mkdir(parents=True, exist_ok=True)
    VCF_OUT.write_text(build_vcard(), encoding="utf-8", newline="")
    QR_OUT.write_text(build_qr_svg(), encoding="utf-8")
    print(f"wrote {VCF_OUT.relative_to(ROOT)} ({VCF_OUT.stat().st_size:,} bytes)")
    print(f"wrote {QR_OUT.relative_to(ROOT)} ({QR_OUT.stat().st_size:,} bytes)")


if __name__ == "__main__":
    main()
