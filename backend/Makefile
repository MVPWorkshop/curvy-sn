# be sure to run `npm run generate-jwt` and export BEARER_TOKEN=<result>
stress-test-200:
	docker compose up -d --build && \
	sleep 3 && \
	k6 run --env JWT_TOKEN=$(BEARER_TOKEN) ./test/stress-test/stress-test.200.js && \
	docker compose down -v

# be sure to run `npm run generate-jwt` and export BEARER_TOKEN=<result>
stress-test-400:
	docker compose up -d --build && \
	sleep 3 && \
	k6 run --env JWT_TOKEN=$(BEARER_TOKEN) ./test/stress-test/stress-test.400.js && \
	docker compose down -v

stress-test-403:
	docker compose up -d --build && \
	sleep 3 && \
	k6 run ./test/stress-test/stress-test.403.js && \
	docker compose down -v