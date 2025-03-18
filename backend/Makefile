stress-test:
	docker compose up -d --build && \
	sleep 3 && \
	k6 run ./test/stress-test/stress-test.200.js && \
	sleep 3 && \
	k6 run ./test/stress-test/stress-test.400.js && \
	docker compose down -v