rm -rf dist

HOST_PLATFORM=$(uname -s)
COMMAND_FIND=$(echo ". -regex '.*\.(info|js|map|d\.ts)' -not -path '**/node_modules/*' -not -path  './.next/*'")
if [ "$HOST_PLATFORM" = "Darwin" ]; \
  then bash -c "$(echo "find -E ${COMMAND_FIND} -not -path './docs/**/javascripts/*' -delete")"; \
  else \
    find $COMMAND_FIND -exec rm {} \; ; \
fi