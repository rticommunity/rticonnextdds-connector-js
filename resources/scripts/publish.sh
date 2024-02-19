#!/bin/bash
set -x

json_name='package.json'
package_name=$(jq -r '.name' $json_name)
package_version=$(jq -r '.version' $json_name)
libraries=(**/lib/*/*.so)

if [ ${#libraries[@]} -eq 0 ]; then
    echo "Error: No libraries were found, download them before using this script."
    exit 1
fi

build_id=$(strings ${libraries[0]} | grep -o 'BUILD_.*')
modified_build_id=${build_id//_/\-}
version_to_publish=$package_version-$modified_build_id

sed -i "/version/c\  \"version\": \"$version_to_publish\"," ${json_name}
# Unpublish in case we are uploading the same version again
npm unpublish ${package_name}@${version_to_publish} --registry https://$NPM_RESGISTRY
npm publish --registry https://$NPM_RESGISTRY
