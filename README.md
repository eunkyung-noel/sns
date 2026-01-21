#  Bubble-SNS: Infrastructure as Code & Full-Stack Project

> **인프라 자동화(IaC)와 백엔드 로직 중심의 실시간 SNS 플랫폼 설계**

## 1. 프로젝트 개요
* **서비스 목적**: 보안성과 확장성을 고려한 실시간 소통 및 음악 공유 커뮤니티.
* **핵심 가치**: CloudFormation을 통한 인프라 재현성 확보 및 Prisma ORM 기반의 데이터 무결성 보장.
* **운영 상태**: 비용 효율화(Cost Optimization)를 위해 현재 인프라는 IaC 코드로 보존 중이며, 로컬 환경에서 모든 API 검증을 완료함.

## 2. 기술 스택 (Tech Stack)
* **Infrastructure**: AWS (VPC, EC2, RDS, CloudFormation, IAM, Security Group)
* **Backend**: Node.js (Express), Prisma ORM
* **Database**: MySQL 8.0 (AWS RDS)
* **Process Management**: PM2
* **Frontend**: React

## 3. 핵심 설계 및 기여도 (1인 개발)

###  인프라 자동화 (IaC)
* **CloudFormation 설계**: VPC, Public/Private Subnet, IGW를 코드로 관리하여 인프라 구축 시간 **90% 단축**.
* **Zero-Touch 배포**: EC2 `UserData` 스크립트를 통해 패키지 설치, Git 클론, DB 마이그레이션 자동화 구현.
* **보안 계층화**: RDS를 프라이빗 서브넷에 배치하고 보안 그룹(SG)을 통해 최소 권한 접근 제어 적용.

###  백엔드 및 DB 아키텍처
* **Prisma ORM 활용**: Type-safe한 쿼리 작성으로 런타임 데이터 오류 방지 및 생산성 향상.
* **데이터 모델링**: 사용자(User), 게시글(Post), 댓글(Comment) 간의 1:N 관계를 명확히 설계하고 DB 인덱싱 전략 수립.
* **인증 시스템**: JWT(JSON Web Token)를 활용한 보안 인증 흐름 설계.

## 4. 아키텍처 다이어그램


## 5. 트러블슈팅 (RCA)
### **문제: Prisma Client 권한 충돌 (EPERM)**
* **증상**: 윈도우 환경에서 `npx prisma generate` 실행 시 파일 수정 권한 거부 발생.
* **원인**: 백엔드 프로세스가 엔진 파일을 점유 중이거나 관리자 권한 미달 확인.
* **해결**: PM2 프로세스 종료 스크립트 작성 및 관리자 권한 터미널 실행 프로세스 수립으로 해결.

## 6. 실행 방법
### **Infrastructure (AWS)**
1. `infra/sns-infrastructure.yaml` 파일을 AWS CloudFormation 스택으로 업로드.
2. 생성된 EC2의 퍼블릭 IP로 접속.

### **Local Development**
1. `npm install` (의존성 설치)
2. `npx prisma db push` (DB 스키마 동기화)
3. `pm2 start src/app.js` (서버 가동)