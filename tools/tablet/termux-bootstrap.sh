#!/data/data/com.termux/files/usr/bin/sh
set -eu

: "${PC_PUBLIC_KEY:?Set PC_PUBLIC_KEY with the dedicated PC public SSH key before running this script.}"

pkg install -y openssh

mkdir -p "$HOME/.ssh" "$HOME/AnatomiaTerminal/security" "$HOME/AnatomiaTerminal/pc"
chmod 700 "$HOME/.ssh"
touch "$HOME/.ssh/authorized_keys"

grep -qxF "$PC_PUBLIC_KEY" "$HOME/.ssh/authorized_keys" ||
  printf '%s\n' "$PC_PUBLIC_KEY" >> "$HOME/.ssh/authorized_keys"

chmod 600 "$HOME/.ssh/authorized_keys"

sshd 2>/dev/null || true

printf 'USER=%s\n' "$(whoami)"
printf 'HOSTKEY=%s\n' "$(ssh-keygen -lf "$PREFIX/etc/ssh/ssh_host_ed25519_key.pub")"
printf 'SETUP_DONE\n'
