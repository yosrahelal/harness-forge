#!/usr/bin/env node
// PreToolUse(Bash): no real transaction, no secret, no remote RPC. Exit 2 = blocked, message goes back to the agent.
// Forks are started outside the agents (scripts/gates/fork.sh, run by a human); agents only see localhost.
'use strict';
const { readStdin } = require('./lib');
const input = readStdin();
const cmd = String((input.tool_input && input.tool_input.command) || '');
if (!cmd) process.exit(0);

const BLOCK = [
  [/--broadcast\b/, 'diffusion de transaction (--broadcast)'],
  [/\bcast\s+(send|publish|mktx|wallet\s+(import|private-key|decrypt-keystore|sign))\b/, 'signature ou diffusion via cast'],
  [/\bforge\s+create\b/, 'forge create déploie un contrat : utiliser un script sans --broadcast'],
  [/--(private-key|mnemonic|mnemonic-path|keystore|account|ledger|trezor|aws|unlocked)\b/, 'clé, keystore, wallet matériel ou compte déverrouillé'],
  [/\b(PRIVATE_KEY|MNEMONIC|SEED_PHRASE|DEPLOYER_KEY|ETH_KEYSTORE)\b/, 'variable de secret'],
  [/\bS[A-Z2-7]{55}\b/, 'valeur au format clé secrète Stellar'],
  [/\bstellar\s+keys\s+(show|secret|add|fund)\b/, 'lecture ou import de clé Stellar'],
  [/\bstellar\s+(contract\s+(deploy|invoke|install|upload|extend|restore)|tx\s+(send|sign))\b(?![^|;&]*--network\s+local\b)/, 'transaction Stellar hors réseau local (ajouter --network local)'],
  [/(^|[\s"'=])\.env(\.[\w-]+)?(\s|$|["'])/, 'lecture d\'un fichier .env'],
  [/\b(eth_sendRawTransaction|eth_sendTransaction|personal_sign|eth_sign)\b/, 'méthode RPC d\'écriture ou de signature'],
];
for (const [re, why] of BLOCK) {
  if (re.test(cmd)) {
    process.stderr.write(`[pipeline] Commande refusée : ${why}.\nAucun agent ne signe ni ne diffuse : produire une transaction non signée (batch Safe) et la confier à un humain.\n`);
    process.exit(2);
  }
}
const urls = cmd.match(/\b(https?|wss?):\/\/[^\s"'`)]+/gi) || [];
const remote = urls.filter((u) => !/^(https?|wss?):\/\/(127\.0\.0\.1|localhost|0\.0\.0\.0|\[::1\])(:\d+)?(\/|$)/i.test(u));
if (remote.length) {
  process.stderr.write(`[pipeline] Commande refusée : URL non locale (${remote[0]}). Les agents n'utilisent que les forks Anvil/Stellar locaux lancés hors agents.\n`);
  process.exit(2);
}
process.exit(0);
