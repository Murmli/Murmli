String? stringWithout0(String? string) {
  if (string == null || string.isEmpty) return string;
  if (string == '0') return string;
  if (string.endsWith('.0')) return string.substring(0, string.length - 2);
  return string;
}
