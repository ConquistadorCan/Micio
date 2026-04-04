# Tables

## Users
```
- id UUIDv7
- email (unique notnull)
- nickname (unique notnull min3 max25)
- password (notnull min8 max100)
- created_at
- updated_at
```

## Conversations
```
- id
- type (1-1, group)
- conversation_name (min3 max50)
- created_at
- updated_at
```

## Conversation_Participants
```
- id
- converstaion_id
- user_id
- is_muted
- last_seen
- created_at
- updated_at
```

## Messages
```
- id
- sender_id
- message VARCHAR(2000)
- conversation_id
- created_at
- updated_at
```

## Refresh Tokens
```
- id
- user_id
- refresh_token
- expires_at
- created_at
- updated_at
```


# Endpoints

## REST
```
- POST /auth/register 
- POST /auth/login
- POST /auth/refresh
- POST /auth/logout
- GET /conversations
- GET /messages/{conversation_id}
- GET /users/search?q=nickname
- POST /conversations
```

## Socket
```
- message:send
- conversation:join
- conversation:leave
```
