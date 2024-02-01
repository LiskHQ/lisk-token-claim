import {
	Table,
	Column,
	Model,
	AllowNull,
	BeforeUpdate,
	BeforeCreate,
	Index,
} from 'sequelize-typescript';

@Table
class Signature extends Model {
	@Index({
		name: 'addressDestinationSigner',
		unique: true,
	})
	@AllowNull(false)
	@Column
	declare lskAddress: string;

	@AllowNull(false)
	@Column
	declare destination: string;

	@Index({
		name: 'addressDestinationSigner',
		unique: true,
	})
	@AllowNull(false)
	@Column
	declare signer: string;

	@AllowNull(false)
	@Column
	declare isOptional: boolean;

	@AllowNull(false)
	@Column
	declare r: string;

	@AllowNull(false)
	@Column
	declare s: string;

	@BeforeUpdate
	@BeforeCreate
	static makeLowerCase(item: Signature) {
		item.destination = item.destination.toLowerCase();
		item.signer = item.signer.toLowerCase();
		item.r = item.r.toLowerCase();
		item.s = item.s.toLowerCase();
	}
}
export default Signature;
