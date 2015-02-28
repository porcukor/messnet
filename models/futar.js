/* 
** Futar Schema
*/

function init(Schema, mongoose) {
	var FutarSchema = new Schema({

    nev: String,
    teljesnev: String,
    taj: Number,
    aktiv: Boolean
});

	var MM = mongoose.model('futar', FutarSchema, 'futar');
	return MM;
}
module.exports.init = init;
