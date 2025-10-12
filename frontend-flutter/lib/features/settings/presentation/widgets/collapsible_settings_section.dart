import 'package:flutter/material.dart';

class CollapsibleSettingsSection extends StatefulWidget {
  final String title;
  final IconData icon;
  final Widget child;
  final bool initiallyExpanded;
  final Color? backgroundColor;
  final Color? iconColor;

  const CollapsibleSettingsSection({
    super.key,
    required this.title,
    required this.icon,
    required this.child,
    this.initiallyExpanded = true,
    this.backgroundColor,
    this.iconColor,
  });

  @override
  State<CollapsibleSettingsSection> createState() =>
      _CollapsibleSettingsSectionState();
}

class _CollapsibleSettingsSectionState
    extends State<CollapsibleSettingsSection> {
  @override
  void initState() {
    super.initState();
  }

  @override
  Widget build(BuildContext context) {
    return Card(
      color: widget.backgroundColor,
      child: Theme(
        data: Theme.of(context).copyWith(
          dividerColor: Colors.transparent,
        ),
        child: ExpansionTile(
          leading: Icon(
            widget.icon,
            color: widget.iconColor ?? Theme.of(context).colorScheme.primary,
          ),
          title: Text(
            widget.title,
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
              color:
                  widget.iconColor ?? Theme.of(context).colorScheme.onSurface,
            ),
          ),
          initiallyExpanded: widget.initiallyExpanded,
          onExpansionChanged: (bool expanded) {
            // Expansion state is handled by ExpansionTile itself
          },
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
              child: widget.child,
            ),
          ],
        ),
      ),
    );
  }
}
