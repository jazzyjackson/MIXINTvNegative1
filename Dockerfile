from debian
MAINTAINER Colten Jackson <cjackson@mixint.xyz>

RUN apt-get update -y \
    && apt-get install -y git curl man make sudo gcc g++ build-essential

RUN curl -sL https://deb.nodesource.com/setup_9.x | sudo -E bash -    

# install nodejs / npm / n / latest node
RUN apt-get update -y \
    && apt-get install -y npm nodejs \
    && npm i -g n \
    && n latest

# modify the sudoers file so when switchboards are spawned, environment is maintained
RUN echo 'Defaults env_keep += "PYTHONPATH PORT"' >> /etc/sudoers.d/secureMod \
    && chmod 440 /etc/sudoers.d/secureMod

ARG APP_HOME='/opt/'
COPY . $APP_HOME
WORKDIR $APP_HOME

ENV nokeyok true
ENV PORT 3000
CMD ["node","operator"]
EXPOSE 3000
