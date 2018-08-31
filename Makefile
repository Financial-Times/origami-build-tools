# Origami Service Makefile
# ------------------------
# This section of the Makefile should not be modified, it includes
# commands from the Origami service Makefile.
# https://github.com/Financial-Times/origami-service-makefile
include node_modules/@financial-times/origami-service-makefile/index.mk
# [edit below this line]
# ------------------------

# Verify security and licensing of production dependencies
# TODO: Add this to origami-service-makefile
snyk:
	snyk test --severity-threshold=high

whitesource:
	echo "We use Snyk GitHub integration" 

snyk-monitor:
	snyk monitor --org=jakechampion

# npm publishing tasks
# --------------------

# Publish the module to npm
npm-publish:
	npm-prepublish --verbose
	npm publish --access public

# Configuration
# -------------

INTEGRATION_TIMEOUT = 10000
INTEGRATION_SLOW = 2000

SERVICE_NAME = Origami Build Tools
SERVICE_SYSTEM_CODE = origami-build-tools
SERVICE_SALESFORCE_ID = $(SERVICE_NAME)

