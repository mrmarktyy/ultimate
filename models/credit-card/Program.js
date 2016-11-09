var keystone = require('keystone');
var Types = keystone.Field.Types;

var Program = new keystone.List('Program');

Program.add({
  name: { type: Types.Text, required: true, initial: true, index: true },
  isReward: { type: Types.Boolean, indent: true, default: false, initial: true },
  isPartner: { type: Types.Boolean, indent: true, default: false, initial: true },
});

Program.schema.pre('validate', function (next) {
  if (this.isReward === false && this.isPartner === false) {
    next(Error('Both is reward and is partner cannot be false'));
  }

  next();
});

Program.schema.pre('remove', function (next) {
  next(Error('You cannot remove a program'));
});

Program.schema.index({ name: 1 }, { unique: true });
Program.track = true;
Program.defaultColumns = 'name, isReward, isPartner';
Program.register();