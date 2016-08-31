var mysqlCreds = services[svcName][0]['credentials'];

module.exports = {
	/***** Setting up MySQL database *****/
	'connection':{
		'connectionLimit': 100,
		'host': mysqlCreds.hostname,
		'port': mysqlCreds.port,
		'user': mysqlCreds.username,
		'password': mysqlCreds.password
	},
	'database': mysqlCreds.name,
	'users_table': 'users'
	/***** Done setting up mysql database ******/
};