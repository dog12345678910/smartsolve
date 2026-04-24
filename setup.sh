#!/bin/bash
# SmartSolve Setup Script
# Just run: bash setup.sh

echo ""
echo "  SmartSolve Setup"
echo "  =================="
echo ""

# Check for git
if ! command -v git &> /dev/null; then
    echo "Git not found. Installing via Xcode tools..."
    xcode-select --install
    echo "After install finishes, run this script again."
    exit 1
fi

# Check for node
if ! command -v node &> /dev/null; then
    echo "Node.js not found."
    echo "Go to https://nodejs.org and install it, then run this script again."
    open "https://nodejs.org"
    exit 1
fi

# Check for GitHub CLI
if ! command -v gh &> /dev/null; then
    echo "Installing GitHub CLI..."
    brew install gh 2>/dev/null || {
        echo "Homebrew not found. Installing..."
        /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
        brew install gh
    }
fi

# Login to GitHub if needed
gh auth status &>/dev/null || {
    echo ""
    echo "Log in to GitHub (a browser window will open):"
    gh auth login --web
}

# Install dependencies
echo ""
echo "Installing dependencies..."
npm install

# Create GitHub repo and push
echo ""
echo "Creating GitHub repo and pushing..."
git branch -M main
gh repo create smartsolve --private --source=. --push

echo ""
echo "Done! Your code is on GitHub."
echo ""
echo "LAST STEP: Deploy to Vercel"
echo "1. Go to https://vercel.com"
echo "2. Sign in with GitHub"
echo "3. Click 'Add New Project'"
echo "4. Select 'smartsolve'"  
echo "5. Click 'Deploy'"
echo ""
echo "That's it. Your app will be live."
echo ""
open "https://vercel.com/new"
