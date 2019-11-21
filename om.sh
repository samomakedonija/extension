#!/bin/bash
if [ $# -eq 0 ]
  then
    echo "Available commands:"
    node -e 'console.log(
      Object.keys(
        require(`./package.json`).scripts
      ).filter(
        script => !script.includes(`install`) && !script.startsWith(`_`)
      ).join(`, `)
    );'
    exit
fi

npm run --silent -- "$@"
