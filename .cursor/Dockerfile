FROM ubuntu:24.04

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        ca-certificates \
        curl \
        docker.io \
        docker-compose-v2 \
        git \
        iptables \
        nodejs \
        npm \
        python3 \
        python3-pip \
        python3-venv \
    && rm -rf /var/lib/apt/lists/* \
    && update-alternatives --set iptables /usr/sbin/iptables-legacy 2>/dev/null || true \
    && update-alternatives --set ip6tables /usr/sbin/ip6tables-legacy 2>/dev/null || true

RUN useradd -m -s /bin/bash ubuntu || true

USER ubuntu
