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

FROM node:18.7-slim

RUN apt-get update \
    && apt-get install -y gcc g++ make python3 python3-pip \
    && groupadd -g 789 jenkins \
    && useradd -u 789 -g jenkins -m jenkins

RUN npm install -g npm jsdoc

USER jenkins

ENV PATH="/home/jenkins/.local/bin:${PATH}"
