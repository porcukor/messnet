/* 
** User Schema
*/

function init(Schema, mongoose) {
	var UserSchema = new Schema({
		username: String,
		password: String,
		salt: String,
		hash: String,
		id: Number,
		type: String
	});

	var MM = mongoose.model('user', UserSchema, 'user');
	return MM;
}
module.exports.init = init;
