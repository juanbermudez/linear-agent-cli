#!/usr/bin/env python3
"""
Create Linear issues and projects from JSON templates

This script reads template files and creates Linear resources with proper
variable substitution and validation.
"""

import json
import subprocess
import sys
from pathlib import Path
from typing import Dict, Any, Optional


def load_template(template_path: str) -> Dict[str, Any]:
    """Load and parse a template file"""
    path = Path(template_path)
    if not path.exists():
        raise FileNotFoundError(f"Template not found: {template_path}")

    with open(path, 'r') as f:
        return json.load(f)


def substitute_variables(template: Dict[str, Any], variables: Dict[str, str]) -> Dict[str, Any]:
    """Replace {{variable}} placeholders in template"""
    def substitute_value(value):
        if isinstance(value, str):
            for key, replacement in variables.items():
                value = value.replace(f"{{{{{key}}}}}", replacement)
            return value
        elif isinstance(value, dict):
            return {k: substitute_value(v) for k, v in value.items()}
        elif isinstance(value, list):
            return [substitute_value(item) for item in value]
        return value

    return substitute_value(template)


def create_issue_from_template(
    template: Dict[str, Any],
    variables: Optional[Dict[str, str]] = None
) -> str:
    """Create an issue from a template"""
    if variables:
        template = substitute_variables(template, variables)

    # Build command
    cmd = ['linear', 'issue', 'create', '--json']

    # Required fields
    if 'title' not in template or 'team' not in template:
        raise ValueError("Template must include 'title' and 'team' fields")

    cmd.extend(['--title', template['title']])
    cmd.extend(['--team', template['team']])

    # Optional fields
    if 'description' in template:
        cmd.extend(['--description', template['description']])
    if 'priority' in template:
        cmd.extend(['--priority', str(template['priority'])])
    if 'estimate' in template:
        cmd.extend(['--estimate', str(template['estimate'])])
    if 'assignee' in template:
        cmd.extend(['--assignee', template['assignee']])
    if 'labels' in template and isinstance(template['labels'], list):
        cmd.extend(['--label'] + template['labels'])
    if 'project' in template:
        cmd.extend(['--project', template['project']])
    if 'milestone' in template:
        cmd.extend(['--milestone', template['milestone']])
    if 'cycle' in template:
        cmd.extend(['--cycle', template['cycle']])
    if 'parent' in template:
        cmd.extend(['--parent', template['parent']])
    if 'state' in template:
        cmd.extend(['--state', template['state']])
    if 'due_date' in template:
        cmd.extend(['--due-date', template['due_date']])

    # Execute command
    result = subprocess.run(cmd, capture_output=True, text=True)
    data = json.loads(result.stdout)

    if not data.get('success'):
        error = data.get('error', {})
        raise RuntimeError(f"Failed to create issue: {error.get('message', 'Unknown error')}")

    return data['issue']['identifier']


def create_project_from_template(
    template: Dict[str, Any],
    variables: Optional[Dict[str, str]] = None
) -> str:
    """Create a project from a template"""
    if variables:
        template = substitute_variables(template, variables)

    # Build command
    cmd = ['linear', 'project', 'create', '--json']

    # Required fields
    if 'name' not in template or 'team' not in template:
        raise ValueError("Template must include 'name' and 'team' fields")

    cmd.extend(['--name', template['name']])
    cmd.extend(['--team', template['team']])

    # Optional fields
    if 'description' in template:
        cmd.extend(['--description', template['description']])
    if 'content' in template:
        cmd.extend(['--content', template['content']])
    if 'lead' in template:
        cmd.extend(['--lead', template['lead']])
    if 'color' in template:
        cmd.extend(['--color', template['color']])
    if 'start_date' in template:
        cmd.extend(['--start-date', template['start_date']])
    if 'target_date' in template:
        cmd.extend(['--target-date', template['target_date']])
    if 'priority' in template:
        cmd.extend(['--priority', str(template['priority'])])
    if 'status' in template:
        cmd.extend(['--status', template['status']])

    # Execute command
    result = subprocess.run(cmd, capture_output=True, text=True)
    data = json.loads(result.stdout)

    if not data.get('success'):
        error = data.get('error', {})
        raise RuntimeError(f"Failed to create project: {error.get('message', 'Unknown error')}")

    return data['project']['slug']


def main():
    if len(sys.argv) < 3:
        print("Usage: create_from_template.py <template-type> <template-path> [variables.json]")
        print("\nTemplate types: issue, project")
        print("\nExamples:")
        print("  create_from_template.py issue templates/bug-report.json")
        print("  create_from_template.py issue templates/feature.json vars.json")
        print("  create_from_template.py project templates/quarterly-project.json")
        sys.exit(1)

    template_type = sys.argv[1]
    template_path = sys.argv[2]
    variables_path = sys.argv[3] if len(sys.argv) > 3 else None

    # Load template
    try:
        template = load_template(template_path)
    except Exception as e:
        print(f"Error loading template: {e}", file=sys.stderr)
        sys.exit(1)

    # Load variables if provided
    variables = None
    if variables_path:
        try:
            variables = load_template(variables_path)
        except Exception as e:
            print(f"Error loading variables: {e}", file=sys.stderr)
            sys.exit(1)

    # Create resource
    try:
        if template_type == 'issue':
            identifier = create_issue_from_template(template, variables)
            print(f"✓ Created issue: {identifier}")
        elif template_type == 'project':
            slug = create_project_from_template(template, variables)
            print(f"✓ Created project: {slug}")
        else:
            print(f"Unknown template type: {template_type}", file=sys.stderr)
            print("Valid types: issue, project", file=sys.stderr)
            sys.exit(1)
    except Exception as e:
        print(f"Error creating resource: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == '__main__':
    main()
