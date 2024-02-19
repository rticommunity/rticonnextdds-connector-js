#!/bin/bash
set -x

json_name='package.json'
package_name=$(jq '.name' $json_name)
package_version=$(jq '.version' $json_name)
libraries=(**/lib/*/*.so)

if [ ${#so_files[@]} -eq 0 ]; then
    echo "Error: No libraries were found, download them before using this script."
    exit 1
fi

build_id=$(strings ${libs[0]} | grep -o 'BUILD_.*')
modified_build_id=${build_id//_/\-}
version_to_publish=$package_version-$modified_build_id

sed -i "/version/c\  \"version\": \"$version_to_publish\"," ${json_name}
npm unpublish ${package_name}@${version_to_publish} --registry https://$NPM_RESGISTRY
npm publish --registry https://$NPM_RESGISTRY
