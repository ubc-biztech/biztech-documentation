---
title: Endpoint Registry
nextjs:
  metadata:
    title: Endpoint Registry
    description: Complete table of every HTTP endpoint across all 21 backend services, with methods, paths, and auth requirements.
---

Every HTTP endpoint in the BizTech backend. There are 21 services with roughly 165 endpoints. {% .lead %}

---

## How to Read This

- **Auth = Cognito**: The endpoint requires a valid Cognito JWT in the `Authorization` header. API Gateway validates the token before the Lambda handler runs.
- **Auth = Public**: No authentication required. Anyone can call it.
- **Path parameters** like `{id}` are extracted from `event.pathParameters` in the handler.
- **Query parameters** are in `event.queryStringParameters`.

---

## hello

| Method | Path     | Auth   | Handler         |
| ------ | -------- | ------ | --------------- |
| GET    | `/hello` | Public | `handler.hello` |

Health check endpoint. Used to verify the API is running.

---

## events

| Method | Path                                                  | Auth    | Handler                               |
| ------ | ----------------------------------------------------- | ------- | ------------------------------------- |
| GET    | `/events/`                                            | Public  | `handler.getAll`                      |
| GET    | `/events/{id}/{year}`                                 | Public  | `handler.get`                         |
| GET    | `/events/getActiveEvent`                              | Public  | `handler.getActiveEvent`              |
| POST   | `/events/`                                            | Cognito | `handler.create`                      |
| PATCH  | `/events/{id}/{year}`                                 | Cognito | `handler.update`                      |
| DELETE | `/events/{id}/{year}`                                 | Cognito | `handler.del`                         |
| POST   | `/events/event-image-upload-url`                      | Cognito | `handler.createThumbnailPicUploadUrl` |
| GET    | `/events/{id}/{year}/feedback/{formType}`             | Public  | `handler.getFeedbackForm`             |
| POST   | `/events/{id}/{year}/feedback/{formType}`             | Public  | `handler.submitFeedback`              |
| GET    | `/events/{id}/{year}/feedback/{formType}/submissions` | Cognito | `handler.getFeedbackSubmissions`      |

---

## users

| Method | Path                             | Auth    | Handler                       |
| ------ | -------------------------------- | ------- | ----------------------------- |
| POST   | `/users/`                        | Public  | `handler.create`              |
| GET    | `/users/check/{email}`           | Public  | `handler.checkUser`           |
| GET    | `/users/checkMembership/{email}` | Public  | `handler.checkUserMembership` |
| GET    | `/users/{email}`                 | Cognito | `handler.get`                 |
| GET    | `/users/`                        | Cognito | `handler.getAll`              |
| PATCH  | `/users/{email}`                 | Cognito | `handler.update`              |
| PATCH  | `/users/favEvent/{email}`        | Cognito | `handler.favouriteEvent`      |
| DELETE | `/users/{email}`                 | Cognito | `handler.del`                 |

---

## members

| Method | Path                         | Auth    | Handler                       |
| ------ | ---------------------------- | ------- | ----------------------------- |
| POST   | `/members/`                  | Cognito | `handler.create`              |
| GET    | `/members/{id}`              | Cognito | `handler.get`                 |
| GET    | `/members/email/{profileID}` | Cognito | `handler.getEmailFromProfile` |
| GET    | `/members/`                  | Cognito | `handler.getAll`              |
| PATCH  | `/members/{id}`              | Cognito | `handler.update`              |
| DELETE | `/members/{id}`              | Cognito | `handler.del`                 |
| POST   | `/members/grant`             | Cognito | `handler.grantMembership`     |

---

## registrations

| Method | Path                             | Auth    | Handler               |
| ------ | -------------------------------- | ------- | --------------------- |
| POST   | `/registrations/`                | Public  | `handler.post`        |
| GET    | `/registrations/`                | Public  | `handler.get`         |
| PUT    | `/registrations/{email}/{fname}` | Public  | `handler.put`         |
| DELETE | `/registrations/{email}`         | Cognito | `handler.del`         |
| DELETE | `/registrations`                 | Cognito | `handler.delMany`     |
| PUT    | `/registrations/massUpdate`      | Public  | `handler.massUpdate`  |
| GET    | `/registrations/leaderboard/`    | Public  | `handler.leaderboard` |

---

## payments

| Method | Path                | Auth   | Handler           |
| ------ | ------------------- | ------ | ----------------- |
| POST   | `/payments`         | Public | `handler.payment` |
| POST   | `/payments/webhook` | Public | `handler.webhook` |
| POST   | `/payments/cancel`  | Public | `handler.cancel`  |

All payment endpoints are public because Stripe webhooks can't send Cognito JWTs. The webhook handler validates requests using the Stripe webhook signature instead.

---

## profiles

| Method | Path                               | Auth    | Handler                               |
| ------ | ---------------------------------- | ------- | ------------------------------------- |
| POST   | `/profiles`                        | Cognito | `handler.create`                      |
| POST   | `/profiles/partner/partial`        | Public  | `handler.createPartialPartnerProfile` |
| POST   | `/profiles/company`                | Public  | `handler.createCompanyProfile`        |
| POST   | `/profiles/company/link-partner`   | Public  | `handler.linkPartnerToCompany`        |
| POST   | `/profiles/sync-partner-data`      | Public  | `handler.syncPartnerData`             |
| GET    | `/profiles/profile/{profileID}`    | Public  | `handler.getPublicProfile`            |
| GET    | `/profiles/user/`                  | Cognito | `handler.getUserProfile`              |
| PATCH  | `/profiles/user/`                  | Cognito | `handler.updatePublicProfile`         |
| POST   | `/profiles/profile-pic-upload-url` | Cognito | `handler.createProfilePicUploadUrl`   |

---

## interactions

| Method | Path                         | Auth    | Handler                     |
| ------ | ---------------------------- | ------- | --------------------------- |
| POST   | `/interactions/search`       | Public  | `handler.searchHandler`     |
| POST   | `/interactions/`             | Cognito | `handler.postInteraction`   |
| GET    | `/interactions/journal/{id}` | Cognito | `handler.checkConnection`   |
| GET    | `/interactions/journal/`     | Cognito | `handler.getAllConnections` |
| GET    | `/interactions/quests/`      | Cognito | `handler.getAllQuests`      |
| GET    | `/interactions/wall`         | Public  | `handler.getWallSnapshot`   |

---

## quests

| Method | Path                                          | Auth    | Handler                    |
| ------ | --------------------------------------------- | ------- | -------------------------- |
| GET    | `/quests/{event_id}/{year}`                   | Cognito | `handler.getQuest`         |
| GET    | `/quests/event/{event_id}/{year}`             | Cognito | `handler.getQuestsByEvent` |
| GET    | `/quests/kiosk/{event_id}/{year}/{profileId}` | Public  | `handler.getQuestKiosk`    |
| PATCH  | `/quests/{event_id}/{year}`                   | Cognito | `handler.updateQuest`      |

---

## qr

| Method | Path                        | Auth    | Handler          |
| ------ | --------------------------- | ------- | ---------------- |
| POST   | `/qrscan/`                  | Public  | `handler.post`   |
| GET    | `/qr/`                      | Cognito | `handler.get`    |
| GET    | `/qr/{id}/{eventID}/{year}` | Public  | `handler.getOne` |
| POST   | `/qr/`                      | Public  | `handler.create` |
| PATCH  | `/qr/{id}/{eventID}/{year}` | Cognito | `handler.update` |
| DELETE | `/qr/{id}/{eventID}/{year}` | Cognito | `handler.del`    |

---

## prizes

| Method | Path           | Auth    | Handler          |
| ------ | -------------- | ------- | ---------------- |
| GET    | `/prizes/`     | Cognito | `handler.getAll` |
| POST   | `/prizes/`     | Cognito | `handler.create` |
| PATCH  | `/prizes/{id}` | Cognito | `handler.update` |
| DELETE | `/prizes/{id}` | Cognito | `handler.del`    |

---

## teams

| Method | Path                                  | Auth    | Handler                             |
| ------ | ------------------------------------- | ------- | ----------------------------------- |
| POST   | `/team/make`                          | Cognito | `handler.makeTeam`                  |
| POST   | `/team/join`                          | Cognito | `handler.joinTeam`                  |
| POST   | `/team/leave`                         | Cognito | `handler.leaveTeam`                 |
| GET    | `/team/{eventID}/{year}`              | Cognito | `handler.get`                       |
| PUT    | `/team/points`                        | Public  | `handler.updateTeamPoints`          |
| PUT    | `/team/addQuestions`                  | Public  | `handler.addMultipleQuestions`      |
| POST   | `/team/getTeamFromUserID`             | Public  | `handler.getTeamFromUserID`         |
| POST   | `/team/changeTeamName`                | Public  | `handler.changeTeamName`            |
| GET    | `/team/scores-all`                    | Public  | `handler.getNormalizedRoundScores`  |
| GET    | `/team/feedback/{teamID}`             | Public  | `handler.getTeamFeedbackScore`      |
| GET    | `/team/judge/currentTeamID/{judgeID}` | Public  | `handler.getJudgeCurrentTeam`       |
| GET    | `/team/judge/feedback/{judgeID}`      | Public  | `handler.getJudgeSubmissions`       |
| POST   | `/team/judge/feedback`                | Public  | `handler.createJudgeSubmissions`    |
| PUT    | `/team/judge/feedback`                | Public  | `handler.updateJudgeSubmission`     |
| PUT    | `/team/judge/currentTeam/{teamID}`    | Public  | `handler.updateCurrentTeamForJudge` |
| GET    | `/team/round`                         | Public  | `handler.getCurrentRound`           |
| PUT    | `/team/round/{round}`                 | Public  | `handler.setCurrentRound`           |

---

## transactions

| Method | Path             | Auth    | Handler          |
| ------ | ---------------- | ------- | ---------------- |
| GET    | `/transactions/` | Cognito | `handler.getAll` |
| POST   | `/transactions/` | Cognito | `handler.create` |

---

## btx

| Method | Path                           | Auth    | Handler                          |
| ------ | ------------------------------ | ------- | -------------------------------- |
| GET    | `/btx/projects`                | Public  | `handler.getProjects`            |
| GET    | `/btx/market/snapshot`         | Public  | `handler.getMarketSnapshot`      |
| POST   | `/btx/market/buy`              | Cognito | `handler.postBuy`                |
| POST   | `/btx/market/sell`             | Cognito | `handler.postSell`               |
| GET    | `/btx/portfolio`               | Cognito | `handler.getPortfolio`           |
| GET    | `/btx/trades`                  | Public  | `handler.getRecentTradesHandler` |
| GET    | `/btx/price-history`           | Public  | `handler.getPriceHistory`        |
| GET    | `/btx/leaderboard`             | Public  | `handler.getLeaderboard`         |
| POST   | `/btx/admin/investment-impact` | Public  | `handler.postInvestmentImpact`   |
| POST   | `/btx/admin/project`           | Public  | `handler.postAdminProject`       |
| POST   | `/btx/admin/seed`              | Public  | `handler.postAdminSeedUpdate`    |
| POST   | `/btx/admin/phase-bump`        | Public  | `handler.postAdminPhaseBump`     |

---

## investments

| Method | Path                                       | Auth    | Handler                  |
| ------ | ------------------------------------------ | ------- | ------------------------ |
| POST   | `/investments/invest`                      | Cognito | `handler.invest`         |
| GET    | `/investments/teamStatus/{teamId}`         | Cognito | `handler.teamStatus`     |
| GET    | `/investments/investorStatus/{investorId}` | Cognito | `handler.investorStatus` |
| GET    | `/investments`                             | Cognito | `handler.investments`    |

---

## emails

| Method | Path                               | Auth    | Handler                       |
| ------ | ---------------------------------- | ------- | ----------------------------- |
| GET    | `/emails/templates/`               | Cognito | `handler.listEmailTemplates`  |
| GET    | `/emails/templates/{templateName}` | Cognito | `handler.getEmailTemplate`    |
| POST   | `/emails/templates/`               | Cognito | `handler.createEmailTemplate` |
| PATCH  | `/emails/templates/`               | Cognito | `handler.updateEmailTemplate` |
| DELETE | `/emails/templates/{templateName}` | Cognito | `handler.deleteEmailTemplate` |

---

## instagram

| Method | Path                       | Auth    | Handler                      |
| ------ | -------------------------- | ------- | ---------------------------- |
| GET    | `/instagram/analytics`     | Cognito | `handler.getAnalytics`       |
| POST   | `/instagram/token/refresh` | Cognito | `handler.refreshTokenManual` |
| GET    | `/instagram/token/status`  | Cognito | `handler.getTokenStatus`     |

---

## partnerships

| Method | Path                                                     | Auth    | Handler                                  |
| ------ | -------------------------------------------------------- | ------- | ---------------------------------------- |
| GET    | `/partnerships/dashboard`                                | Cognito | `handler.getDashboard`                   |
| GET    | `/partnerships/partners`                                 | Cognito | `handler.listPartners`                   |
| POST   | `/partnerships/partners`                                 | Cognito | `handler.createPartner`                  |
| GET    | `/partnerships/partners/{partnerId}`                     | Cognito | `handler.getPartner`                     |
| PATCH  | `/partnerships/partners/{partnerId}`                     | Cognito | `handler.updatePartner`                  |
| GET    | `/partnerships/events`                                   | Cognito | `handler.listEvents`                     |
| GET    | `/partnerships/events/{eventId}`                         | Cognito | `handler.getEvent`                       |
| POST   | `/partnerships/events`                                   | Cognito | `handler.createEvent`                    |
| PATCH  | `/partnerships/events/{eventId}`                         | Cognito | `handler.updateEvent`                    |
| DELETE | `/partnerships/events/{eventId}`                         | Cognito | `handler.deleteEvent`                    |
| POST   | `/partnerships/partners/{partnerId}/events`              | Cognito | `handler.createPartnerEvent`             |
| PATCH  | `/partnerships/partner-events/{linkId}`                  | Cognito | `handler.updatePartnerEvent`             |
| DELETE | `/partnerships/partner-events/{linkId}`                  | Cognito | `handler.deletePartnerEvent`             |
| GET    | `/partnerships/partners/{partnerId}/documents`           | Cognito | `handler.listPartnerDocuments`           |
| POST   | `/partnerships/partners/{partnerId}/documents`           | Cognito | `handler.createPartnerDocument`          |
| PATCH  | `/partnerships/partner-documents/{documentId}`           | Cognito | `handler.updatePartnerDocument`          |
| DELETE | `/partnerships/partner-documents/{documentId}`           | Cognito | `handler.deletePartnerDocument`          |
| GET    | `/partnerships/partners/{partnerId}/communications`      | Cognito | `handler.listPartnerCommunications`      |
| POST   | `/partnerships/partners/{partnerId}/communications`      | Cognito | `handler.createPartnerCommunication`     |
| PATCH  | `/partnerships/partner-communications/{communicationId}` | Cognito | `handler.updatePartnerCommunication`     |
| DELETE | `/partnerships/partner-communications/{communicationId}` | Cognito | `handler.deletePartnerCommunication`     |
| GET    | `/partnerships/export`                                   | Cognito | `handler.exportPartners`                 |
| GET    | `/partnerships/google-sheets/status`                     | Cognito | `handler.googleSheetsStatus`             |
| POST   | `/partnerships/google-sheets/sync`                       | Cognito | `handler.googleSheetsSync`               |
| GET    | `/partnerships/email/config`                             | Cognito | `handler.massEmailConfig`                |
| GET    | `/partnerships/email/templates`                          | Cognito | `handler.listMassEmailTemplatesHandler`  |
| POST   | `/partnerships/email/templates`                          | Cognito | `handler.createMassEmailTemplateHandler` |
| PATCH  | `/partnerships/email/templates/{templateId}`             | Cognito | `handler.updateMassEmailTemplateHandler` |
| DELETE | `/partnerships/email/templates/{templateId}`             | Cognito | `handler.deleteMassEmailTemplateHandler` |
| POST   | `/partnerships/email/send`                               | Cognito | `handler.sendBulkMassEmailHandler`       |
| GET    | `/partnerships/email/sync/status`                        | Cognito | `handler.emailSyncStatus`                |
| POST   | `/partnerships/email/sync/ingest`                        | Public  | `handler.emailSyncIngest`                |

The partnerships service is the largest, with 32 endpoints.

---

## bots

| Method | Path                       | Auth    | Handler                                        |
| ------ | -------------------------- | ------- | ---------------------------------------------- |
| POST   | `/discord/interactions`    | Public  | `handlerDiscord.interactions`                  |
| POST   | `/discord/account/mapping` | Cognito | `handlerDiscord.mapDiscordAccountToMembership` |
| POST   | `/discord/webhook`         | Public  | `handlerDiscord.webhook`                       |
| POST   | `/slack/github`            | Public  | `handlerSlack.slackGithubReminder`             |
| POST   | `/slack/shortcut/events`   | Public  | `handlerSlack.shortcutHandler`                 |

---

## quizzes

| Method | Path                           | Auth   | Handler             |
| ------ | ------------------------------ | ------ | ------------------- |
| POST   | `/quizzes/upload`              | Public | `handler.upload`    |
| GET    | `/quizzes/report/{profile_id}` | Public | `handler.report`    |
| GET    | `/quizzes/{event}`             | Public | `handler.all`       |
| GET    | `/quizzes/aggregate/{event}`   | Public | `handler.aggregate` |
| GET    | `/quizzes/perMbti/{mbti}`      | Public | `handler.perMbti`   |
| POST   | `/quizzes/wrapped`             | Public | `handler.wrapped`   |

---

## stickers

WebSocket-based service with some HTTP endpoints. Not included in local development routing.

| Method | Path                        | Auth   | Handler                   |
| ------ | --------------------------- | ------ | ------------------------- |
| GET    | `/scores/`                  | Public | `handler.getScores`       |
| GET    | `/scores/{roomID}`          | Public | `handler.getScoresRoom`   |
| GET    | `/scores/team/{teamName}`   | Public | `handler.getScoresTeam`   |
| GET    | `/stickers/`                | Public | `handler.getStickers`     |
| GET    | `/stickers/{roomID}`        | Public | `handler.getStickersRoom` |
| GET    | `/stickers/team/{teamName}` | Public | `handler.getStickersTeam` |

---

## Summary

| Service       | Endpoints | Auth Required | Public  |
| ------------- | --------- | ------------- | ------- |
| hello         | 1         | 0             | 1       |
| events        | 10        | 4             | 6       |
| users         | 8         | 5             | 3       |
| members       | 7         | 7             | 0       |
| registrations | 7         | 2             | 5       |
| payments      | 3         | 0             | 3       |
| profiles      | 9         | 4             | 5       |
| interactions  | 6         | 3             | 3       |
| quests        | 4         | 3             | 1       |
| qr            | 6         | 3             | 3       |
| prizes        | 4         | 4             | 0       |
| teams         | 17        | 4             | 13      |
| transactions  | 2         | 2             | 0       |
| btx           | 12        | 3             | 9       |
| investments   | 4         | 4             | 0       |
| emails        | 5         | 5             | 0       |
| instagram     | 3         | 3             | 0       |
| partnerships  | 32        | 31            | 1       |
| bots          | 5         | 1             | 4       |
| quizzes       | 6         | 0             | 6       |
| stickers      | 6         | 0             | 6       |
| **Total**     | **~157**  | **~88**       | **~69** |

---

## Related Pages

- [API Gateway & Authorizer](/docs/backend-architecture/api-gateway) — how routing and auth work at the infrastructure level
- [Authentication System](/docs/systems/authentication) — how Cognito auth flows through API Gateway
- [Services & Patterns](/docs/backend-architecture/services) — environment configuration and service structure
