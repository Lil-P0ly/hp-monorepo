#!/bin/bash
yc config set service-account-key key.json
yc config set cloud-id b1gdgi3cosaohdh0mbt1
yc config set folder-id b1gfnjs9i7k59nierucj

export YC_TOKEN=$(yc iam create-token)
export YC_CLOUD_ID=$(yc config get cloud-id)
export YC_FOLDER_ID=$(yc config get folder-id)
