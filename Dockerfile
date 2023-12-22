# ------------------------------------------------------------------------------
# (c) 2023 Copyright, Real-Time Innovations, Inc.  All rights reserved.
# RTI grants Licensee a license to use, modify, compile, and create derivative
# works of the Software.  Licensee has the right to distribute object form only
# for use with RTI products.  The Software is provided "as is", with no warranty
# of any type, including any warranty for fitness for any purpose. RTI is under
# no obligation to maintain or support the Software.  RTI shall not be liable 
# for any incidental or consequential damages arising out of the use or
# inability to use the software.
# ------------------------------------------------------------------------------

ARG NODE_VERSION
FROM node:${NODE_VERSION}

RUN apt-get update \
    && apt-get install -y gcc g++ git make python3 python3-pip python3-venv \
    && useradd -u 789 -m jenkins

RUN mkdir -p /opt/node_deps \
    && npm config set prefix /opt/node_deps \
    && chmod o+rwx /opt/node_deps

RUN python3 -m venv /opt/venv \
    && chmod -R o+rwx /opt/venv 

ENV PATH="/opt/venv/bin:/home/jenkins/npm/bin:/home/jenkins/.local/bin:${PATH}"
