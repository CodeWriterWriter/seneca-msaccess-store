if [[ `git status test/*.accdb --porcelain` ]]; then
  # changes
  echo "Detected local changes to the test database, either commit or revert these changes."
  exit 1
fi