 /* 
** Log Schema
*/

function init(Schema, mongoose) {
	var LogSchema = new Schema({
//		_job: { type: Schema.Types.ObjectId, ref: 'Munka' },
		ido: Date,
		tipus: String,
		desc: String,
		creator: String
  });

	var MM = mongoose.model('log', LogSchema, 'log');
	return MM;
}
module.exports.init = init;

 
 
 