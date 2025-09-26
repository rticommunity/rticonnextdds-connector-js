#!/bin/bash
set -x

json_name='package.json'
package_name=$(jq -r '.name' $json_name)
package_version=$(jq -r '.version' $json_name)
libraries=(**/lib/*/*.so)
registry_opt=''

if [ ${#libraries[@]} -eq 0 ]; then
    echo "Error: No libraries were found, download them before using this script."
    exit 1
fi

build_id=$(strings ${libraries[0]} | grep -o 'BUILD_.*')
jq ". += {\"rti.build-id\": \"${build_id}\"}" package.json > package.json.tmp
mv package.json.tmp package.json

# Get current git branch
current_branch=$(git rev-parse --abbrev-ref HEAD)

# If branch doesn't start with release/connector, update the version
if [[ ! "$current_branch" =~ ^release/connector ]]; then
    # Append -dev to the current package version
    new_version="${package_version}-dev"

    # Update package.json with new version
    jq ".version = \"${new_version}\"" package.json > package.json.tmp
    mv package.json.tmp package.json

    package_version=$new_version
    echo "Updated version to ${package_version} for non-release branch"
fi

# If publishing to a repository other than the default one, add the Build ID to the
# version string and unpublish the package in case it was already published to the
# internal repo.
if [[ -n "$NPM_REGISTRY" ]]; then
    registry_opt="--registry https://$NPM_REGISTRY"

    # Unpublish in case we are uploading the same version again
    npm unpublish ${package_name}@${package_version} ${registry_opt}
fi

npm publish ${registry_opt}
