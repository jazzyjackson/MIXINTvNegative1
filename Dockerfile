from debian
MAINTAINER Colten Jackson <cjackson@mixint.xyz>

RUN apt-get update -y \
    && apt-get install -y man make sudo gcc g++ build-essential

# install nodejs / npm / n / latest node
RUN apt-get update -y \
    && apt-get install -y npm nodejs \
    && npm i -g n \
    && n latest


# ARG APP_HOME='/usr/'

# RUN make

CMD ["node","operator"]
EXPOSE 3000
