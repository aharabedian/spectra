---
title: Putting the suite together
description: How PRISM, LENS and LUMEN find each other, which computer runs what, and the one rule that keeps them apart.
sidebar:
  order: 0
---

PRISM, LUMEN and LENS each run on their own, so you can start with any one of them. This guide is for when you
want all three: which computer does what, how they find each other, and the one rule that keeps them apart.

:::note
LENS only watches. Messages flow from agents to the hub, never back, so a broken hub can never stop routing or
switch off a generator. Control stays on each program's own screen.
:::

## What runs where

Four computers is the full set. Only the PRISM router and the LUMEN computer touch your machines; the hub just
listens.

| Computer | Runs | Needs | Ports |
|---|---|---|---|
| **PRISM router** | `prism` | Adapters on the ME controller, buses and machines; a Database Upgrade; a wireless card | 4242 control, 4243 LENS |
| **PRISM control** | `prism-control` | Tier 3 GPU and screen, keyboard, wireless card. Optional | 4242 |
| **LUMEN** | `lumen` | Adapters on each LSC controller; GPU and screen; a network card to report | 4243 |
| **LENS hub** | `lens-hub` | Tier 3 GPU and screen, keyboard, a network card that reaches the agents; a Glasses Terminal for the HUD | 4243 |

Every computer runs OpenOS on the Lua 5.3 architecture. LSCs too far apart for cable can each have their own
LUMEN computer; give each one its own node name and they all report to the same hub.

### Install

On each computer, with an Internet Card, swap in the program's name:

```sh
wget -f https://raw.githubusercontent.com/aharabedian/prism/main/src/prism-update.lua /home/prism-update.lua
/home/prism-update      # then lens-update / lumen-update the same way
```

## Ports and secrets

LENS traffic has its **own port and its own token**, never PRISM's. The router speaks to its control screen on
`modemPort` (4242) with `token`, and to the hub on `lensPort` (4243) with `lensToken`. The two must differ.

```lua title="/home/prism.cfg"
modemPort = 4242,
token     = "router-secret",
lensPort  = 4243,
lensNode  = "prism-ore",
lensToken = "base-secret",
```

```lua title="/home/lumen.cfg"
lensPort  = 4243,
lensNode  = "power-main",
lensToken = "base-secret",
```

```lua title="/home/lens-hub.cfg"
node       = "hub",
port       = 4243,
token      = "base-secret",
staleAfter = 3,
```

You rarely type these: `prism-setup` asks for them in its *LENS monitoring* step (or the GENERAL tab of its
editor), and `lumen-setup` and `lens-setup` ask too. Give every agent its own `lensNode`: `prism-ore`,
`prism-smelt`, `power-main`. The hub adds it as the `node` label on every series.

## Start in this order

1. **Agents first.** Turn on LENS reporting in `prism-setup` and `lumen-setup`, then restart `prism` and
   `lumen`. They report after every scan or reading.
2. **Then `lens-setup` on the hub.** It says hello on the port, lists the agents that answer, and offers their
   panels: backlog, machines running and down for each router; fill for the LSCs.
3. **Then `lens-hub`**, or reboot if you chose start on boot. Add an agent later? Run `lens-setup` again: only
   the new ones are offered.

## The lens/1 protocol

Agents push a **complete** snapshot of their state, not a diff, so a lost packet costs nothing: the next one
replaces everything. Each snapshot carries the agent's own health verdict, Prometheus-style metrics, and the
alerts it sees right now.

| kind | From → to | When |
|---|---|---|
| `hello` | hub → broadcast | Hub start, or when a snapshot arrives from a node it has no descriptions for |
| `describe` | agent → broadcast | Agent start, in reply to `hello`, and whenever a metric is added |
| `snapshot` | agent → broadcast | Every `interval` seconds; early (at most once a second) when health or alerts change |

Every message is one `serialization.serialize`d table of at most 7 KB, under the modem's 8 KB limit. A trimmed
example from a PRISM router:

```lua
{ proto = "lens/1", kind = "snapshot", node = "prism-ore", role = "prism",
  boot = 81723, seq = 412, interval = 10, health = "warn",
  samples = {
    { "prism_backlog_items", 4200, { process = "ore" } },
    { "prism_machine_state", 1, { process = "ore", machine = "mac2", state = "down" } },
  },
  alerts = { { id = "down:mac2", level = "warn", text = "mac2 stopped with work waiting" } },
}
```

A node that misses `staleAfter` snapshots in a row turns `STALE` and raises a `BAD` alert. Writing your own
agent? The full spec is [the telemetry protocol](../lens/docs/telemetry/) in the LENS docs.

## Metrics from PRISM and LUMEN

Names carry their role as a prefix and their unit as a suffix. States are one 0/1 series per state, so the hub
can count them with `sum` without knowing what they mean. The full lists:
[PRISM](../prism/docs/configuration/#reporting-to-lens) and [LUMEN](../lumen/docs/configuration/#reporting-to-lens).

| Metric | Labels | Meaning |
|---|---|---|
| `prism_backlog_items` | process | Items waiting |
| `prism_stalled_seconds` | process | How long a stalled process has been stalled |
| `prism_machine_state` | process, machine, state | 1 for `running`, `idle` or `down`; 0 for the others |
| `lumen_stored_eu`, `lumen_capacity_eu` | lsc | Stored and capacity |
| `lumen_net_5m_eut` | lsc | In minus out over 5 minutes |
| `lumen_lsc_up` | lsc | 1 when the LSC can be read |

## Rules across systems

This is what the suite is for. A hub rule can look at metrics from several nodes at once: here, a warning that
beeps when the ore line is busy while power is low. Missing data counts as false, so a node going quiet raises
its stale alert instead.

```lua title="/home/lens-hub.cfg"
rules = {
  { id = "ore-low-power", level = "warn", text = "Ore line busy on low power",
    when = 'sum(lumen_stored_eu) / sum(lumen_capacity_eu) < 0.25 and sum(prism_backlog_items{node="prism-ore"}) > 0',
    ["for"] = 120 },
},
```

The query language is in [LENS: queries](../lens/docs/queries/), and more cross-system views are in
[LENS: examples](../lens/docs/examples/#across-systems).

## Developing

All three repos share a layout and a workflow. Programs in `src/` are thin; modules in `lib/<name>/` hold the
logic and document their interface in a header comment.

```sh
make dev      # luacheck and a Python venv for rendering screens, once
make check    # lint + the mocked test suite
make screens  # render the screens the tests draw into PNGs
```

PRISM and LUMEN report with the same two modules, `lens.metrics` and `lens.codec`, vendored byte for byte from
LENS by `tools/sync-lens.sh`. A test compares them with a `../lens` checkout, so the protocol can't drift
between repos.
