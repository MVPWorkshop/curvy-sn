stress-test:
	docker compose up -d --build && \
	sleep 3 && \
	k6 run ./src/stress-test/stress-test.js && \
	docker compose down -v