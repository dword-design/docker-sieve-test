FROM debian:bookworm-slim

RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    dovecot-core dovecot-sieve dovecot-managesieved && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

RUN useradd -ms /bin/bash testuser
USER testuser

WORKDIR /test

# Use -t /dev/null to suppress trace, while keeping test-only mode
ENTRYPOINT ["sieve-test", "-t", "/dev/null"]
