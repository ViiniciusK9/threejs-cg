import {
	Group,
	Vector3
} from 'three'

class Bullet
{
	constructor(group)
	{
	    this.velocity = new Vector3();
	    this.isDead = false;
		this.group = group

		setTimeout(() => {
			this.isDead = true
		}, 3000)
	}

	get shouldRemove()
	{
		return this.isDead
	}

	setVelocity(x, y, z)
	{
		this.velocity.set(x, y, z)
	}

	update()
	{
		this.group.position.x += this.velocity.x
		this.group.position.y += this.velocity.y
		this.group.position.z += this.velocity.z
	}
}

export default Bullet;