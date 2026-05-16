#!/data/data/com.termux/files/usr/bin/sh
set -eu

CONFIG="$PREFIX/etc/ssh/sshd_config"
MARKER_BEGIN="# omega tablet ssh begin"
MARKER_END="# omega tablet ssh end"

tmp_config="$(mktemp)"
awk "
  /$MARKER_BEGIN/ { skip=1; next }
  /$MARKER_END/ { skip=0; next }
  skip != 1 { print }
" "$CONFIG" > "$tmp_config"

cat >> "$tmp_config" <<'EOF'
# omega tablet ssh begin
Port 8022
ListenAddress 0.0.0.0
PubkeyAuthentication yes
PasswordAuthentication no
KbdInteractiveAuthentication no
KexAlgorithms curve25519-sha256,curve25519-sha256@libssh.org,diffie-hellman-group14-sha256
HostKeyAlgorithms ssh-ed25519
PubkeyAcceptedAlgorithms ssh-ed25519
# omega tablet ssh end
EOF

cat "$tmp_config" > "$CONFIG"
rm -f "$tmp_config"

pkill sshd 2>/dev/null || true
sshd

printf 'SSHD_COMPAT_DONE\n'
printf 'HOSTKEY=%s\n' "$(ssh-keygen -lf "$PREFIX/etc/ssh/ssh_host_ed25519_key.pub")"
