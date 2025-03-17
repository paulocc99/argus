FROM python:3.10-alpine

ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

RUN echo UTC > /etc/timezone

RUN apk add --no-cache curl

RUN addgroup -S argus && adduser -u 1000 -S argus -G argus
RUN mkdir /opt/app && chown -R argus:argus /opt/app

ENV POETRY_NO_INTERACTION=1 \
	POETRY_VIRTUALENVS_IN_PROJECT=true \
	POETRY_HOME="/opt/poetry" \
	POETRY_CACHE_DIR=/tmp/poetry_cache \
	VENV_PATH="/opt/app/.venv"
ENV PATH "$POETRY_HOME/bin:$VENV_PATH/bin:$PATH"

RUN curl -sSL https://install.python-poetry.org/ | python3 -

USER argus
WORKDIR /opt/app

ENV PATH="$POETRY_HOME/bin:$VENV_PATH/bin:$PATH"

COPY pyproject.toml /opt/app
RUN poetry install
RUN pip install setuptools

RUN mkdir /opt/app/data

COPY --chown=argus:argus . /opt/app
RUN touch /opt/app/data/.env

# ENTRYPOINT ["/entrypoint.sh"]
EXPOSE 1337

CMD ["gunicorn", "--bind", "0.0.0.0:1337", "--thread", "4", "main:app"]
