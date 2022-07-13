const {PubSub} = require('@google-cloud/pubsub');
const {BigQuery} = require('@google-cloud/bigquery');
const pubsub = new PubSub();
const bigquery = new BigQuery();
const topicName = "projects/astral-sorter-287918/topics/CodewayPubSub"


const service = {
    saveLog: async (body) => {
        const log = Buffer.from(JSON.stringify(body));
        try {
            const msg = await pubsub.topic(topicName).publishMessage({data:log});
            return {res: msg, code: 200};
        }
        catch {
            return {res: "error", code: 500};
        }
    },

    queryLog: async () =>  {
        const query = 
        `SELECT date, new_user_count, average_session_duration, active_user_count  FROM 
            (   
                (SELECT date, COUNT(date) as new_user_count FROM 
                    (SELECT MIN(DATE(TIMESTAMP_MILLIS(event_time))) AS date FROM \`astral-sorter-287918.Logs.Log\` GROUP BY user_id) 
                GROUP BY date)
            JOIN 
                (SELECT mydate, AVG(time) as average_session_duration, COUNT(time) AS active_user_count FROM 
                    (SELECT DATE(TIMESTAMP_MILLIS(event_time)) as mydate,MAX(event_time)-MIN(event_time) AS time FROM \`astral-sorter-287918.Logs.Log\` GROUP BY DATE(TIMESTAMP_MILLIS(event_time)), user_id) 
                GROUP BY mydate)
            ON date = mydate
            )
        `
        let options = {
            query,
            location: 'US',
        };

        var info;
        try {
            const [main_query] = await bigquery.createQueryJob(options);
            [info] = await main_query.getQueryResults();
        }
        catch {
            return {res: "error", code: 500};
        }

        const total_user_count_query = 'SELECT COUNT(DISTINCT(user_id)) as count FROM `astral-sorter-287918.Logs.Log`';
        options = {
            query:total_user_count_query,
            location: 'US',
        }

        var count;
        try {
            const [count_query] = await bigquery.createQueryJob(options);
            [[count]] = await count_query.getQueryResults();
        }
        catch {
            return {res: "error", code: 500};
        }
        
        const daily_stats = [];
        info.forEach(day => {
            daily_stats.push({
                date:day.date.value,
                new_user_count:day.new_user_count,
                average_session_duration:day.average_session_duration,
                active_user_count:day.active_user_count
            })
        })
        const returnInfo = {
            total_users: count.count,
            daily_stats,
        }
        return {res: returnInfo, code: 200};
    }
}

module.exports = service;