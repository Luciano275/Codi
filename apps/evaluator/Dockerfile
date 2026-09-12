FROM docker.io/cloudflare/sandbox:next-python

RUN apt-get update \
  && apt-get install -y --no-install-recommends g++ passwd util-linux \
  && rm -rf /var/lib/apt/lists/* \
  && groupadd --system evaluator \
  && useradd --system --gid evaluator --home-dir /workspace --shell /usr/sbin/nologin evaluator \
  && printf '%s\n' '#include <iostream>' 'int main() { std::cout << 42; }' > /tmp/cpp-smoke.cpp \
  && g++ -std=gnu++20 -static -s -o /tmp/cpp-smoke /tmp/cpp-smoke.cpp \
  && test "$(/tmp/cpp-smoke)" = '42' \
  && rm /tmp/cpp-smoke /tmp/cpp-smoke.cpp
