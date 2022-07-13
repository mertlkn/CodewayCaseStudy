## Codeway Case Study

Written using Node.js, Express.

Services used: Google Bigquery, Google Pubsub, Google Dataflow, Google Cloud Storage, Docker.

For docker image: https://hub.docker.com/r/mertlkn/codeway
docker pull mertlkn/codeway

Note: For authentication I am using service account key json format file. Using this is not the securest way so I did not include my json key file in the image on the DockerHub. Therefore it would not work to directly use docker image on DockerHub. But with including it in the image and running the docker with command 'docker run -p 5002:5001 --env=GOOGLE_APPLICATION_CREDENTIALS=/src/app/service-account.json mertlkn/codeway' works. 

## Running:
    'node index.js' or 
    for developer mode 'npm run dev' which will execute with nodemon to quickly catch code changes and update app.

## Flow:

Express listens on Port 5001. URL to be requested is '/api'. Router is used, endpoints are in '/endpoints/api.js'. Service layer is in 'services' folder, 'services/service.js'.

POST request to '/api' with the given body structure as in the PDF, a message to the topic created in Google PubSub is published. Then within the Google PubSub, message will be directed to Dataflow job. Dataflow job will put the JSON formatted input to the dataset table in Google Bigquery. 

GET request to '/api' will return the required output in the PDF. There are two queries.

### Query 1
``` sql
SELECT date, new_user_count, average_session_duration, active_user_count  FROM 
        (   
            (SELECT date, COUNT(date) as new_user_count FROM 
                (SELECT MIN(DATE(TIMESTAMP_MILLIS(event_time))) AS date FROM 'astral-sorter-287918.Logs.Log' GROUP BY user_id) 
            GROUP BY date)
        JOIN 
            (SELECT mydate, AVG(time) as average_session_duration, COUNT(time) AS active_user_count FROM 
                (SELECT DATE(TIMESTAMP_MILLIS(event_time)) as mydate,MAX(event_time)-MIN(event_time) AS time FROM 'astral-sorter-287918.Logs.Log' GROUP BY DATE(TIMESTAMP_MILLIS(event_time)), user_id) 
            GROUP BY mydate)
        ON date = mydate
        )
```
This can be seperated into two:

First:
``` sql
 (SELECT date, COUNT(date) as new_user_count FROM 
                (SELECT MIN(DATE(TIMESTAMP_MILLIS(event_time))) AS date FROM 'astral-sorter-287918.Logs.Log' GROUP BY user_id) 
            GROUP BY date)
```
Here, rows are grouped by their user_id's and minimum date from their event_times are found. Then from that output, rows are grouped by dates and counts for each day is found. This is used for finding new users count on the respective days.

Second:
``` sql
(SELECT mydate, AVG(time) as average_session_duration, COUNT(time) AS active_user_count FROM 
                (SELECT DATE(TIMESTAMP_MILLIS(event_time)) as mydate,MAX(event_time)-MIN(event_time) AS time FROM 'astral-sorter-287918.Logs.Log' GROUP BY DATE(TIMESTAMP_MILLIS(event_time)), user_id) 
GROUP BY mydate)
```

Here, first grouping is done by days and user_id's. Then day and for each user difference between first and last event_time is calculated and returned. This way session duration is found for each user on each day. Then from that output, rows are grouped by date and average duration is found with AVG function. Also, active user count for that day is also found with COUNT function.

Then these two outputs are joined on days. This way required output is calculated solely with SQL queries.

### Query 2
``` sql
SELECT COUNT(DISTINCT(user_id)) as count FROM 'astral-sorter-287918.Logs.Log'
```
With this query, total user count is found.


After that required json output is constructed and returned.


## Example request and responds:
<img width="852" alt="Ekran Resmi 2022-07-12 17 15 49" src="https://user-images.githubusercontent.com/56360407/178511416-efc16d88-4638-4d7d-ac50-2fe6bd9be2e1.png">
<img width="874" alt="Ekran Resmi 2022-07-12 17 16 19" src="https://user-images.githubusercontent.com/56360407/178511529-733cc73e-3009-491f-aa10-4ff44a8637ad.png">


## Google Services:

### BigQuery
<img width="1252" alt="Ekran Resmi 2022-07-12 17 21 22" src="https://user-images.githubusercontent.com/56360407/178512762-94ae23e5-5b8a-494f-8a01-9f256c9e5374.png">

### PubSub

#### Topics
<img width="1062" alt="Ekran Resmi 2022-07-12 17 18 38" src="https://user-images.githubusercontent.com/56360407/178512087-b2aed9c8-1982-4434-a176-cdd5107a03f3.png">

#### Subscriptions
<img width="1250" alt="Ekran Resmi 2022-07-12 17 19 43" src="https://user-images.githubusercontent.com/56360407/178512433-aa429a74-b219-4b56-8fc9-8786df76478c.png">

### Dataflow
<img width="1242" alt="Ekran Resmi 2022-07-12 17 18 04" src="https://user-images.githubusercontent.com/56360407/178511951-27eba460-45ce-4bab-b4dc-5c0b48e77049.png">

### Cloud storage
<img width="988" alt="Ekran Resmi 2022-07-12 17 17 06" src="https://user-images.githubusercontent.com/56360407/178511710-fdcd6f27-7ae6-40fa-abec-8bb24ce5da35.png">


