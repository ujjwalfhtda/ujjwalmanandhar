#!/bin/zsh

# Navigate to project directory
DIR="$( cd "$( dirname "${BASH_SOURCE[0]:-$0}" )" >/dev/null 2>&1 && pwd )"
cd "$DIR"

echo "================================================="
echo "🚀 AUTO-UPDATE WEBSITE SCRIPT"
echo "================================================="
echo ""

# Export static gallery if node is available
if command -v node >/dev/null 2>&1; then
    echo "📦 Syncing latest gallery data..."
    node -e 'import("./server/src/services/gitSync.js").then(m => m.exportGalleryJson()).catch(()=>{})' 2>/dev/null
fi

echo "🔍 Staging local changes..."
git add -A

# Check if there are changes to commit
if git diff-index --quiet HEAD --; then
    echo "✨ No new changes detected. Your website is up to date!"
else
    TIMESTAMP=$(date "+%Y-%m-%d %H:%M:%S")
    echo "✏️  Committing changes (${TIMESTAMP})..."
    git commit -m "Auto update website (${TIMESTAMP})"
    
    echo "📡 Pushing updates to GitHub..."
    git push origin main
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "================================================="
        echo "✅ SUCCESS! Website changes published to GitHub!"
        echo "   Vercel will auto-deploy your update in ~30 seconds."
        echo "================================================="
    else
        echo ""
        echo "❌ Push failed. Please check your internet connection or git credentials."
    fi
fi

if [ -t 0 ]; then
    echo ""
    echo "Press any key to close..."
    read -k 1 -s
fi
