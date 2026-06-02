@echo off
setlocal enabledelayedexpansion

set PROFILE=reportafrica
set REGION=eu-west-1
set PROJECT=reportafrica

echo === Creating VPC ===
for /f "tokens=*" %%i in ('aws ec2 create-vpc --cidr-block 10.0.0.0/16 --query "Vpc.VpcId" --output text --profile %PROFILE% --region %REGION% 2^>^&1') do set VPC_ID=%%i
echo VPC: %VPC_ID%

aws ec2 modify-vpc-attribute --vpc-id %VPC_ID% --enable-dns-hostnames "{\"Value\":true}" --profile %PROFILE% --region %REGION%
aws ec2 modify-vpc-attribute --vpc-id %VPC_ID% --enable-dns-support "{\"Value\":true}" --profile %PROFILE% --region %REGION%
aws ec2 create-tags --resources %VPC_ID% --tags Key=Name,Value=%PROJECT%-vpc --profile %PROFILE% --region %REGION%

echo === Creating Subnets ===
for /f "tokens=*" %%i in ('aws ec2 create-subnet --vpc-id %VPC_ID% --cidr-block 10.0.1.0/24 --availability-zone %REGION%a --query "Subnet.SubnetId" --output text --profile %PROFILE% --region %REGION% 2^>^&1') do set PUBLIC_A=%%i
aws ec2 create-tags --resources %PUBLIC_A% --tags Key=Name,Value=%PROJECT%-public-a --profile %PROFILE% --region %REGION%
aws ec2 modify-subnet-attribute --subnet-id %PUBLIC_A% --map-public-ip-on-launch --profile %PROFILE% --region %REGION%
echo Public-A: %PUBLIC_A%

for /f "tokens=*" %%i in ('aws ec2 create-subnet --vpc-id %VPC_ID% --cidr-block 10.0.2.0/24 --availability-zone %REGION%b --query "Subnet.SubnetId" --output text --profile %PROFILE% --region %REGION% 2^>^&1') do set PUBLIC_B=%%i
aws ec2 create-tags --resources %PUBLIC_B% --tags Key=Name,Value=%PROJECT%-public-b --profile %PROFILE% --region %REGION%
aws ec2 modify-subnet-attribute --subnet-id %PUBLIC_B% --map-public-ip-on-launch --profile %PROFILE% --region %REGION%
echo Public-B: %PUBLIC_B%

for /f "tokens=*" %%i in ('aws ec2 create-subnet --vpc-id %VPC_ID% --cidr-block 10.0.10.0/24 --availability-zone %REGION%a --query "Subnet.SubnetId" --output text --profile %PROFILE% --region %REGION% 2^>^&1') do set PRIVATE_A=%%i
aws ec2 create-tags --resources %PRIVATE_A% --tags Key=Name,Value=%PROJECT%-private-a --profile %PROFILE% --region %REGION%
echo Private-A: %PRIVATE_A%

for /f "tokens=*" %%i in ('aws ec2 create-subnet --vpc-id %VPC_ID% --cidr-block 10.0.11.0/24 --availability-zone %REGION%b --query "Subnet.SubnetId" --output text --profile %PROFILE% --region %REGION% 2^>^&1') do set PRIVATE_B=%%i
aws ec2 create-tags --resources %PRIVATE_B% --tags Key=Name,Value=%PROJECT%-private-b --profile %PROFILE% --region %REGION%
echo Private-B: %PRIVATE_B%

echo === Creating Internet Gateway ===
for /f "tokens=*" %%i in ('aws ec2 create-internet-gateway --query "InternetGateway.InternetGatewayId" --output text --profile %PROFILE% --region %REGION% 2^>^&1') do set IGW_ID=%%i
aws ec2 attach-internet-gateway --internet-gateway-id %IGW_ID% --vpc-id %VPC_ID% --profile %PROFILE% --region %REGION%
aws ec2 create-tags --resources %IGW_ID% --tags Key=Name,Value=%PROJECT%-igw --profile %PROFILE% --region %REGION%
echo IGW: %IGW_ID%

echo === Creating Route Table ===
for /f "tokens=*" %%i in ('aws ec2 create-route-table --vpc-id %VPC_ID% --query "RouteTable.RouteTableId" --output text --profile %PROFILE% --region %REGION% 2^>^&1') do set RTB_ID=%%i
aws ec2 create-route --route-table-id %RTB_ID% --destination-cidr-block 0.0.0.0/0 --gateway-id %IGW_ID% --profile %PROFILE% --region %REGION%
aws ec2 associate-route-table --route-table-id %RTB_ID% --subnet-id %PUBLIC_A% --profile %PROFILE% --region %REGION%
aws ec2 associate-route-table --route-table-id %RTB_ID% --subnet-id %PUBLIC_B% --profile %PROFILE% --region %REGION%
aws ec2 create-tags --resources %RTB_ID% --tags Key=Name,Value=%PROJECT%-public-rt --profile %PROFILE% --region %REGION%
echo Route Table: %RTB_ID%

echo === Creating Security Groups ===
for /f "tokens=*" %%i in ('aws ec2 create-security-group --group-name %PROJECT%-ec2-sg --description "API server SG" --vpc-id %VPC_ID% --query "GroupId" --output text --profile %PROFILE% --region %REGION% 2^>^&1') do set EC2_SG=%%i
aws ec2 authorize-security-group-ingress --group-id %EC2_SG% --protocol tcp --port 80 --cidr 0.0.0.0/0 --profile %PROFILE% --region %REGION%
aws ec2 authorize-security-group-ingress --group-id %EC2_SG% --protocol tcp --port 443 --cidr 0.0.0.0/0 --profile %PROFILE% --region %REGION%
aws ec2 authorize-security-group-ingress --group-id %EC2_SG% --protocol tcp --port 22 --cidr 0.0.0.0/0 --profile %PROFILE% --region %REGION%
aws ec2 create-tags --resources %EC2_SG% --tags Key=Name,Value=%PROJECT%-ec2-sg --profile %PROFILE% --region %REGION%
echo EC2 SG: %EC2_SG%

for /f "tokens=*" %%i in ('aws ec2 create-security-group --group-name %PROJECT%-rds-sg --description "RDS SG" --vpc-id %VPC_ID% --query "GroupId" --output text --profile %PROFILE% --region %REGION% 2^>^&1') do set RDS_SG=%%i
aws ec2 authorize-security-group-ingress --group-id %RDS_SG% --protocol tcp --port 5432 --source-group %EC2_SG% --profile %PROFILE% --region %REGION%
aws ec2 create-tags --resources %RDS_SG% --tags Key=Name,Value=%PROJECT%-rds-sg --profile %PROFILE% --region %REGION%
echo RDS SG: %RDS_SG%

for /f "tokens=*" %%i in ('aws ec2 create-security-group --group-name %PROJECT%-redis-sg --description "Redis SG" --vpc-id %VPC_ID% --query "GroupId" --output text --profile %PROFILE% --region %REGION% 2^>^&1') do set REDIS_SG=%%i
aws ec2 authorize-security-group-ingress --group-id %REDIS_SG% --protocol tcp --port 6379 --source-group %EC2_SG% --profile %PROFILE% --region %REGION%
aws ec2 create-tags --resources %REDIS_SG% --tags Key=Name,Value=%PROJECT%-redis-sg --profile %PROFILE% --region %REGION%
echo Redis SG: %REDIS_SG%

echo.
echo === NETWORKING COMPLETE ===
echo VPC_ID=%VPC_ID%
echo PUBLIC_A=%PUBLIC_A%
echo PUBLIC_B=%PUBLIC_B%
echo PRIVATE_A=%PRIVATE_A%
echo PRIVATE_B=%PRIVATE_B%
echo EC2_SG=%EC2_SG%
echo RDS_SG=%RDS_SG%
echo REDIS_SG=%REDIS_SG%
