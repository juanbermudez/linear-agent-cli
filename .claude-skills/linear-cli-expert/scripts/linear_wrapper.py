#!/usr/bin/env python3
"""
Linear CLI Python Wrapper

Provides a convenient Python interface to the Linear CLI with error handling,
retry logic, and response parsing.
"""

import json
import subprocess
import time
from typing import Optional, Dict, Any, List


class LinearCLIError(Exception):
    """Custom exception for Linear CLI errors"""
    def __init__(self, message: str, error_code: Optional[str] = None):
        self.message = message
        self.error_code = error_code
        super().__init__(self.message)


class LinearCLI:
    """Wrapper for Linear CLI operations"""

    def __init__(self, max_retries: int = 3, retry_delay: float = 1.0):
        """
        Initialize Linear CLI wrapper

        Args:
            max_retries: Maximum number of retries for failed commands
            retry_delay: Delay in seconds between retries
        """
        self.max_retries = max_retries
        self.retry_delay = retry_delay

    def _exec(self, command: List[str], retry: bool = True) -> Dict[str, Any]:
        """
        Execute Linear CLI command with error handling

        Args:
            command: Command arguments (excluding 'linear' and '--json')
            retry: Whether to retry on failure

        Returns:
            Parsed JSON response from Linear CLI

        Raises:
            LinearCLIError: If command fails after retries
        """
        full_command = ['linear'] + command + ['--json']

        for attempt in range(self.max_retries if retry else 1):
            try:
                result = subprocess.run(
                    full_command,
                    capture_output=True,
                    text=True,
                    check=False
                )

                # Parse JSON response
                try:
                    data = json.loads(result.stdout)
                except json.JSONDecodeError as e:
                    raise LinearCLIError(
                        f"Failed to parse JSON response: {e}\nOutput: {result.stdout}"
                    )

                # Check for success
                if data.get('success', True):  # Some commands don't return success field
                    return data

                # Handle error
                error = data.get('error', {})
                error_code = error.get('code', 'UNKNOWN')
                error_msg = error.get('message', 'Unknown error')

                # Don't retry on certain errors
                if error_code in ['NOT_FOUND', 'INVALID_VALUE', 'MISSING_REQUIRED_FIELD']:
                    raise LinearCLIError(error_msg, error_code)

                # Retry on API errors
                if attempt < self.max_retries - 1:
                    time.sleep(self.retry_delay * (attempt + 1))
                    continue

                raise LinearCLIError(error_msg, error_code)

            except subprocess.SubprocessError as e:
                if attempt < self.max_retries - 1 and retry:
                    time.sleep(self.retry_delay * (attempt + 1))
                    continue
                raise LinearCLIError(f"Failed to execute command: {e}")

        raise LinearCLIError("Maximum retries exceeded")

    # Issue Operations
    def create_issue(
        self,
        title: str,
        team: str,
        description: Optional[str] = None,
        priority: Optional[int] = None,
        estimate: Optional[int] = None,
        assignee: Optional[str] = None,
        labels: Optional[List[str]] = None,
        project: Optional[str] = None,
        milestone: Optional[str] = None,
        cycle: Optional[str] = None,
        parent: Optional[str] = None,
        state: Optional[str] = None,
        due_date: Optional[str] = None,
        blocks: Optional[List[str]] = None,
        related_to: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """Create a new issue"""
        cmd = ['issue', 'create', '--title', title, '--team', team]

        if description:
            cmd.extend(['--description', description])
        if priority:
            cmd.extend(['--priority', str(priority)])
        if estimate:
            cmd.extend(['--estimate', str(estimate)])
        if assignee:
            cmd.extend(['--assignee', assignee])
        if labels:
            cmd.extend(['--label'] + labels)
        if project:
            cmd.extend(['--project', project])
        if milestone:
            cmd.extend(['--milestone', milestone])
        if cycle:
            cmd.extend(['--cycle', cycle])
        if parent:
            cmd.extend(['--parent', parent])
        if state:
            cmd.extend(['--state', state])
        if due_date:
            cmd.extend(['--due-date', due_date])
        if blocks:
            cmd.extend(['--blocks'] + blocks)
        if related_to:
            cmd.extend(['--related-to'] + related_to)

        return self._exec(cmd)

    def update_issue(
        self,
        identifier: str,
        **kwargs
    ) -> Dict[str, Any]:
        """Update an existing issue"""
        cmd = ['issue', 'update', identifier]

        # Add same options as create_issue
        if 'title' in kwargs:
            cmd.extend(['--title', kwargs['title']])
        if 'description' in kwargs:
            cmd.extend(['--description', kwargs['description']])
        if 'priority' in kwargs:
            cmd.extend(['--priority', str(kwargs['priority'])])
        if 'estimate' in kwargs:
            cmd.extend(['--estimate', str(kwargs['estimate'])])
        if 'assignee' in kwargs:
            cmd.extend(['--assignee', kwargs['assignee']])
        if 'labels' in kwargs:
            cmd.extend(['--label'] + kwargs['labels'])
        if 'state' in kwargs:
            cmd.extend(['--state', kwargs['state']])
        if 'due_date' in kwargs:
            cmd.extend(['--due-date', kwargs['due_date']])

        return self._exec(cmd)

    def get_issue(self, identifier: str) -> Dict[str, Any]:
        """Get issue details"""
        return self._exec(['issue', 'view', identifier])

    def list_issues(self, team: Optional[str] = None) -> Dict[str, Any]:
        """List issues"""
        cmd = ['issue', 'list']
        if team:
            cmd.extend(['--team', team])
        return self._exec(cmd)

    # Project Operations
    def create_project(
        self,
        name: str,
        team: str,
        description: Optional[str] = None,
        content: Optional[str] = None,
        lead: Optional[str] = None,
        color: Optional[str] = None,
        start_date: Optional[str] = None,
        target_date: Optional[str] = None,
        priority: Optional[int] = None,
        status: Optional[str] = None
    ) -> Dict[str, Any]:
        """Create a new project"""
        cmd = ['project', 'create', '--name', name, '--team', team]

        if description:
            cmd.extend(['--description', description])
        if content:
            cmd.extend(['--content', content])
        if lead:
            cmd.extend(['--lead', lead])
        if color:
            cmd.extend(['--color', color])
        if start_date:
            cmd.extend(['--start-date', start_date])
        if target_date:
            cmd.extend(['--target-date', target_date])
        if priority:
            cmd.extend(['--priority', str(priority)])
        if status:
            cmd.extend(['--status', status])

        return self._exec(cmd)

    def update_project(self, slug: str, **kwargs) -> Dict[str, Any]:
        """Update an existing project"""
        cmd = ['project', 'update', slug]

        if 'name' in kwargs:
            cmd.extend(['--name', kwargs['name']])
        if 'content' in kwargs:
            cmd.extend(['--content', kwargs['content']])
        if 'lead' in kwargs:
            cmd.extend(['--lead', kwargs['lead']])
        if 'priority' in kwargs:
            cmd.extend(['--priority', str(kwargs['priority'])])
        if 'status' in kwargs:
            cmd.extend(['--status', kwargs['status']])

        return self._exec(cmd)

    def create_milestone(
        self,
        project_id: str,
        name: str,
        target_date: Optional[str] = None,
        description: Optional[str] = None
    ) -> Dict[str, Any]:
        """Create a project milestone"""
        cmd = ['project', 'milestone', 'create', project_id, '--name', name]

        if target_date:
            cmd.extend(['--target-date', target_date])
        if description:
            cmd.extend(['--description', description])

        return self._exec(cmd)

    # Label Operations
    def create_label(
        self,
        name: str,
        team: str,
        color: Optional[str] = None,
        is_group: bool = False,
        parent: Optional[str] = None
    ) -> Dict[str, Any]:
        """Create a label"""
        cmd = ['label', 'create', '--name', name, '--team', team]

        if color:
            cmd.extend(['--color', color])
        if is_group:
            cmd.append('--is-group')
        if parent:
            cmd.extend(['--parent', parent])

        return self._exec(cmd)

    # Document Operations
    def create_document(
        self,
        title: str,
        content: str,
        project: Optional[str] = None,
        current_project: bool = False
    ) -> Dict[str, Any]:
        """Create a document"""
        cmd = ['document', 'create', '--title', title, '--content', content]

        if project:
            cmd.extend(['--project', project])
        if current_project:
            cmd.append('--current-project')

        return self._exec(cmd)


# Example usage
if __name__ == '__main__':
    cli = LinearCLI()

    # Create an issue
    try:
        result = cli.create_issue(
            title="Fix authentication bug",
            team="ENG",
            priority=1,
            assignee="@me",
            labels=["bug", "security"]
        )
        print(f"Created issue: {result['issue']['identifier']}")
    except LinearCLIError as e:
        print(f"Error: {e.message} (Code: {e.error_code})")
