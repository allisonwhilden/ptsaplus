#!/bin/bash

# List all active worktrees with status information
echo "🌳 Git Worktrees Status"
echo "======================"

# Get list of worktrees
worktrees=$(git worktree list --porcelain)

if [ -z "$worktrees" ]; then
    echo "No worktrees found."
    exit 0
fi

# Parse and display worktree information
echo "$worktrees" | while IFS= read -r line; do
    if [[ $line == worktree* ]]; then
        path=${line#worktree }
        echo ""
        echo "📁 Path: $path"
    elif [[ $line == branch* ]]; then
        branch=${line#branch }
        echo "🌿 Branch: $branch"
        
        # Check if there are uncommitted changes
        if [ -d "$path" ]; then
            cd "$path" 2>/dev/null
            if [ $? -eq 0 ]; then
                if ! git diff-index --quiet HEAD -- 2>/dev/null; then
                    echo "⚠️  Status: Uncommitted changes"
                else
                    echo "✅ Status: Clean"
                fi
                
                # Check for untracked files
                if [ -n "$(git ls-files --others --exclude-standard 2>/dev/null)" ]; then
                    echo "📄 Untracked files present"
                fi
                
                # Show last commit
                last_commit=$(git log -1 --pretty=format:"%h %s" 2>/dev/null)
                if [ -n "$last_commit" ]; then
                    echo "📝 Last commit: $last_commit"
                fi
            fi
        fi
    elif [[ $line == HEAD* ]]; then
        commit=${line#HEAD }
        echo "🎯 HEAD: $commit"
    fi
done

echo ""
echo "💡 Use './scripts/worktree-create.sh <feature-name>' to create a new worktree"
echo "💡 Use './scripts/worktree-cleanup.sh <worktree-path>' to remove a worktree"