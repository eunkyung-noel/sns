# Bubble-SNS: Infrastructure as Code & Full-Stack Project

> **인프라 자동화(IaC)와 백엔드 로직 중심의 실시간 SNS 플랫폼 설계**

## 1. 프로젝트 개요
보안성과 확장성을 고려한 실시간 소통 커뮤니티 서비스입니다. CloudFormation을 통한 인프라 재현성 확보 및 Prisma ORM 기반의 데이터 무결성 보장을 핵심 가치로 설계되었습니다.

* **backend**: Node.js & Prisma 기반 REST API 서버 (main 브랜치)
* **frontend**: React 기반 웹 클라이언트 (frontend 브랜치)
* **infra**: AWS CloudFormation을 활용한 인프라 자원 자동화

## 2. 시연 영상
[![SNS 프로젝트 시연 영상](https://img.shields.io/badge/Google%20Drive-시연%20영상%20보러가기-yellow?style=for-the-badge&logo=googledrive)](https://drive.google.com/drive/folders/1rPMKTn0dxdS1L1if9kziClV4VWye3U2x?hl=ko)

## 3. 서비스 엔드포인트
| 서비스 | 환경/포트 | 설명 |
| :--- | :--- | :--- |
| **API Server** | Node.js (Port 8080) | SNS 핵심 기능(CRUD) 및 JWT 인증 API 제공 |
| **Database** | MySQL (AWS RDS) | 유저 및 게시글 데이터 영속성 관리 |
| **Infrastructure** | CloudFormation | VPC, EC2, RDS 등 클라우드 인프라 자원 관리 |
| **CI Pipeline** | GitHub Actions | 코드 푸시 시 빌드 및 Prisma 스키마 검증 자동화 |

## 4. 로컬 개발 환경

### 빌드 및 실행 (Backend)
```bash
cd backend
npm install
npx prisma generate
npm start
## frontend 브랜치에서 실행
git checkout frontend
cd frontend
npm install
npm start
```
## 5. 인프라 자동화 (IaC)
infra/sns-infrastructure.yaml 파일을 통해 AWS 리소스를 표준화하여 관리합니다.
VPC & Networking: Public/Private 서브넷 격리 설계를 통한 네트워크 보안 강화.
Security Group: 최소 권한 원칙(Principle of Least Privilege)에 따른 포트 제어.
Zero-Touch 배포: EC2 UserData를 활용한 패키지 설치 및 환경 구성 자동화.

## 6. CI (Continuous Integration)
GitHub Actions를 활용하여 코드의 무결성을 자동으로 검증합니다.
Workflow: .github/workflows/main.yml
| 단계 | 작업 내용 |
| :--- | :--- |
|**Runtime**|Ubuntu 환경 내 Node.js v20 런타임 구성|
|**Dependency**|npm install을 통한 의존성 설치 무결성 확인|
|**ORM Check**|Prisma Client Generation을 통한 데이터 모델 검증|
|**Build Check**|어플리케이션 빌드 체크(Exit Code 0) 확인|

## 7. 트러블슈팅 (RCA)
개발 및 배포 과정에서 발생한 핵심 기술적 문제를 분석하고 해결한 기록입니다.
| 항목 | 상세 내용|
| :--- | :--- |
|**문제 상황**| Prisma Client 생성 시 파일 시스템 접근 권한 충돌 (EPERM)|
|**발생 증상**| Windows 환경에서 npx prisma generate 시 파일 수정 권한 거부 및 빌드 중단|
|**원인 분석**| 기존 백엔드 프로세스(Node.js/PM2)가 엔진 파일을 점유 중이거나 실행 권한 미달 확인|
|**해결 방안**| 1. PM2 stop 스크립트를 통한 프로세스 점유 해제 자동화|
        **2. 관리자 권한 쉘 기반의 스크립트 실행 환경 구축으로 권한 충돌 원천 차단**
|**문제 상황**|CI 파이프라인 상의 Prisma 엔진 미인식|
|**원인 분석**|깃허브 액션 서버(Ubuntu) 환경 내 환경변수 및 의존성 주입 시점 차이|
|**해결 방안**|npm install 직후 prisma generate 단계 강제 추가로 환경 일관성 확보|

## 8. 주요 기능 (Technical Highlights)
|구분|기술적 성과 (Technical Achievements)|
| :--- | :--- |
|**보안 (Security)**| JWT & Bcrypt 기반 인증: 비밀번호 단방향 해싱 및 Stateless 기반 인증 토큰 처리 설계|
|**데이터 (Data)**| Type-safe DB 설계: Prisma ORM을 활용하여 런타임 데이터 에러 방지 및 쿼리 최적화|
|**아키텍처 (Arch)**| 관심사 분리(SoC): 백엔드(main)와 프론트엔드(frontend) 브랜치 독립 운영 및 CI 분리 관리|
|**운영 (DevOps)**| IaC 인프라 관리: 수동 배포 지양, CloudFormation을 통한 인프라 변경 이력 관리 및 재현성 확보|
|**품질 (Quality)**| CI 파이프라인 구축: 상시 배포 가능한 코드 상태 유지를 위한 자동화된 빌드 검증 프로세스|

# 9. 라이센스
MIT License
