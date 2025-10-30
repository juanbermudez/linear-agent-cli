#!/bin/bash
# Setup Linear team label hierarchy
#
# This script creates a standard label structure for a team, including:
# - Work Type groups (Feature, Bug, Enhancement, etc.)
# - Scope groups (Frontend, Backend, Infrastructure, etc.)
# - Priority groups (Critical, High, Medium, Low)
# - Status labels (Blocked, Needs Review, etc.)
#
# Usage: ./setup_labels.sh <TEAM_KEY>
# Example: ./setup_labels.sh ENG

set -e

TEAM="${1}"

if [ -z "$TEAM" ]; then
    echo "Usage: $0 <TEAM_KEY>"
    echo "Example: $0 ENG"
    exit 1
fi

echo "Setting up label hierarchy for team: $TEAM"
echo ""

# Create Work Type group
echo "Creating Work Type labels..."
linear label create --name "Work-Type" --is-group --team "$TEAM" --color "#6366F1" --json > /dev/null
linear label create --name "Feature" --parent "Work-Type" --team "$TEAM" --color "#10B981" --json > /dev/null
linear label create --name "Bug" --parent "Work-Type" --team "$TEAM" --color "#EF4444" --json > /dev/null
linear label create --name "Enhancement" --parent "Work-Type" --team "$TEAM" --color "#3B82F6" --json > /dev/null
linear label create --name "Refactor" --parent "Work-Type" --team "$TEAM" --color "#8B5CF6" --json > /dev/null
linear label create --name "Documentation" --parent "Work-Type" --team "$TEAM" --color "#6B7280" --json > /dev/null
echo "✓ Work Type labels created"

# Create Scope group
echo "Creating Scope labels..."
linear label create --name "Scope" --is-group --team "$TEAM" --color "#F59E0B" --json > /dev/null
linear label create --name "Frontend" --parent "Scope" --team "$TEAM" --color "#EC4899" --json > /dev/null
linear label create --name "Backend" --parent "Scope" --team "$TEAM" --color "#14B8A6" --json > /dev/null
linear label create --name "API" --parent "Scope" --team "$TEAM" --color "#06B6D4" --json > /dev/null
linear label create --name "Database" --parent "Scope" --team "$TEAM" --color "#8B5CF6" --json > /dev/null
linear label create --name "Infrastructure" --parent "Scope" --team "$TEAM" --color "#64748B" --json > /dev/null
linear label create --name "DevOps" --parent "Scope" --team "$TEAM" --color "#475569" --json > /dev/null
echo "✓ Scope labels created"

# Create Priority group
echo "Creating Priority labels..."
linear label create --name "Priority" --is-group --team "$TEAM" --color "#DC2626" --json > /dev/null
linear label create --name "Critical" --parent "Priority" --team "$TEAM" --color "#991B1B" --json > /dev/null
linear label create --name "High" --parent "Priority" --team "$TEAM" --color "#DC2626" --json > /dev/null
linear label create --name "Medium" --parent "Priority" --team "$TEAM" --color "#F59E0B" --json > /dev/null
linear label create --name "Low" --parent "Priority" --team "$TEAM" --color "#84CC16" --json > /dev/null
echo "✓ Priority labels created"

# Create Status labels (flat, not grouped)
echo "Creating Status labels..."
linear label create --name "Blocked" --team "$TEAM" --color "#DC2626" --json > /dev/null
linear label create --name "Needs-Review" --team "$TEAM" --color "#F59E0B" --json > /dev/null
linear label create --name "In-Testing" --team "$TEAM" --color "#3B82F6" --json > /dev/null
linear label create --name "Ready-to-Deploy" --team "$TEAM" --color "#10B981" --json > /dev/null
echo "✓ Status labels created"

echo ""
echo "✅ Label hierarchy setup complete for team $TEAM!"
echo ""
echo "Created label structure:"
echo "  Work-Type/"
echo "    - Feature"
echo "    - Bug"
echo "    - Enhancement"
echo "    - Refactor"
echo "    - Documentation"
echo ""
echo "  Scope/"
echo "    - Frontend"
echo "    - Backend"
echo "    - API"
echo "    - Database"
echo "    - Infrastructure"
echo "    - DevOps"
echo ""
echo "  Priority/"
echo "    - Critical"
echo "    - High"
echo "    - Medium"
echo "    - Low"
echo ""
echo "  Status (flat):"
echo "    - Blocked"
echo "    - Needs-Review"
echo "    - In-Testing"
echo "    - Ready-to-Deploy"
