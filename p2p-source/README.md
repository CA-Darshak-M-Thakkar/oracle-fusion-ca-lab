# P2P source of truth (Oracle Fusion course)

One set of files feeds **everything**: the 40 EBS R12 replica screens and their Fusion Cloud pairs in the lab website, the tutor quick-guide PDF, and the P2P classroom PPT.
Change a value here (for example a supplier name or an amount) and regenerate; nothing else is edited by hand.

| File | What it holds |
|---|---|
| `data.yaml` | The one dataset (ABC Ltd, Rajkot; Sharma Traders, Mumbai; 10 Office Chairs; IGST 18%). Placeholders such as `{{po}}` in the other files read from here. |
| `p2p.yaml` | The 40 EBS R12 screens (element drawing language, documented at the top of the file). |
| `fusion.yaml` | The Fusion Cloud view of each screen, the Navigator, Tasks panel and users. |
| `guide.yaml` | Text of the tutor guide and the PPT: flow, steps, click paths, field values, status, numbers. |
| `theme.yaml` | Colours and fonts of the EBS look. |
| `build.py` | Generates `src/data/ebs/*.json` in the lab repo. |
| `sync.sh` | One command: `build.py`, then `npm run build` in the lab. |
| `tools/` | The builders for the guide PDF and the PPT (run on the Grok Bot box; they need Chrome, Playwright and the office tools). |

## The one command

In the lab repo (`CA-Darshak-M-Thakkar/oracle-fusion-ca-lab`) this folder is `p2p-source/`:

```
cd p2p-source && ./sync.sh
```

That regenerates the screens, checks the site builds, and prints what to commit. Publishing the site is the repo's normal gh-pages publish.

## Keeping D: and GitHub in sync

* The repo copy (`p2p-source/` in the lab repo) and the copy in `D:\ITT Adv ITT\02 Oracle Fusion Course\10 Source of Truth` are the same files. `source-hash.json` in the lab shows which version of the YAML built the screens (the gallery footer prints it).
* To change the data: edit `data.yaml` (or the other YAML), ask Grok Bot "update everywhere", or run `sync.sh` yourself. Grok Bot then rebuilds the guide PDF and the PPT (`tools/`), copies them to `04 Practice Manuals` and `02 Teaching PPT`, replaces this folder, archives the old versions in `99 Archive`, and publishes the site.
* Dummy data: the GSTINs and addresses are teaching data, not real registrations.

Current source hash is printed by `python3 build.py`.
