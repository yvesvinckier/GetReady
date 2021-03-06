<template>
	<div :class="['selector', canSlide ? 'canAnimate' : '', clipped ? 'clipped' : '']" v-hammer:pan.horizontal="panGesture" :style="{
		'--current-color': backgroundColor,
		'--transition-speed': transitionSpeed * 0.75 + 's',
		'--eased-mouse-position-percent-x': easedMousePositionPercent.x,
		'--eased-mouse-position-percent-y': easedMousePositionPercent.y,
		'--ratio': (vh / vw).toFixed(2),
		'--background-transition-duration': backgroundTransitionDuration + 's',
		'--navigation-arrows-area-width': navigationArrowsAreaWidth + '%',
		'cursor': cursor
	}">
		<div class="background"></div>
		<ul class="hiddenSelector">
			<li v-for="(item, i) in items" :key="item.color + i">
				<div class="selectorItem" ref="items" :style="{
				'--background-color': item.color,
				'--x-offset': item.position.x,
				'--y-offset': item.position.y,
				'--x-shadow-offset': item.shadow.x + '%',
				'--y-shadow-offset': item.shadow.y + '%',
				'--number-of-letters': item.title.length
				}">
					<div class="itemWrapper">
						<div class="img">
							<img :src="PATH + item.img" class="shadow">
							<img :src="PATH + item.img">
						</div>
						<big-title-comp :title="item.title">
							<div class="pagination">
								<span class="current">{{ i + 1 }}</span><span class="slash">/</span>{{ numberOfItems}}
							</div>
						</big-title-comp>
						<div class="subtitle">
							<h3>{{ $t('categories.like') }} <span v-html="item.athlete"></span></h3>
						</div>
					</div>
					<nuxt-link :to="{name: 'page', params: { slug: item.slug }}" class="callToAction">
						<button-comp :text="$t('discover')"></button-comp>
					</nuxt-link>
				</div>
			</li>
		</ul>
		<div class="nav" ref="nav">
			<div class="left" @click="prev">
				<div class="arrow">
					<img src="~/assets/images/arrow.svg"/>
				</div>
			</div>
			<div class="right" @click="next">
				<div class="arrow">
					<img src="~/assets/images/arrow.svg"/>
				</div>
			</div>
		</div>
	</div>
</template>
<script>
import buttonComp from '~/components/Button';
import BigTitleComp from '~/components/BigTitle';
export default {
	props: {
		items: {
			default: function() {
				return [];
			}
		}
	},

	data() {
		return {
			rotation: 0,
			canSlide: false,
			transitionSpeed: 1,
			navigationArrowsAreaWidth: 15,
			navigationIndicationSlide: 0.02,
			backgroundTransitionDuration: 0,
			cursor: '-webkit-grab',
			height: this.vh,
			PATH: process.env.PATH,
			clipped: false,
			easedMousePositionPercent: {
				x: 0,
				y: 0
			}
		};
	},

	computed: {
		progressionStep: function() {
			return 100 / this.numberOfItems;
		},
		rotationStep: function() {
			return Math.PI * 2 / this.numberOfItems;
		},
		numberOfItems: function() {
			return this.items.length;
		},
		itemWidth: function() {
			return this.vw ? this.vw : process.browser ? window.innerWidth : 1;
		},
		apothem: function() {
			return this.itemWidth / (2 * Math.tan(Math.PI / this.items.length));
		},
		progression: function() {
			return (this.rotation * 100) / (Math.PI * 2);
		},
		vw: function() {
			return this.$store.getters.viewportSize.width;
		},
		vh: function() {
			return this.$store.getters.viewportSize.height;
		},
		fov: function() {
			const aspect = process.browser ? window.innerWidth / window.innerHeight : 1;
			let fov = 55;
			switch (this.numberOfItems) {
				case 3:
					fov = 1 / (Math.pow(1.7, aspect - 9.5)) + 28;
					break;
				case 4:
					fov = (1 / (Math.pow(2.21, aspect - 6.3)) + 23);
					break;
			}
			fov = fov * (this.vw / this.vw); // Hacky way to trigger recalculation on vw change
			return this.$route.query.fov ? this.$route.query.fov : fov;
		},
		tempSlide: function() {
			let tempIndex = Math.round((Math.PI * 2 - this.rotation) / this.rotationStep);
			const tempSlide = tempIndex === this.items.length ? 0 : tempIndex < 0 ? this.items.length - 1 : tempIndex;
			return this.mod(tempSlide, this.numberOfItems);
		},
		backgroundColor: function() {
			return this.items[this.tempSlide].color;
		},
		currentSlide: function() {
			return this.$store.getters.currentSlide;
		},
		canInteract: function() {
			return this.$route.name === 'index';
		},
		offset: function() {
			return -0.0115 * this.vh;
		}
	},

	watch: {
		'$store.getters.easedMousePositionPercent': function(position) {
			if (this.$store.getters.scrollPosition.y < this.vh) {
				this.easedMousePositionPercent = position;
			}
		},
		'currentSlide': function(index) {
			if (this.items[index]) {
				const elementsArray = Array.from(this.$el.querySelectorAll('.threeDselector .selectorItem'));

				elementsArray.forEach(elt => {
					elt.classList.remove('currentSlide');
					elt.querySelector('.buttonComp').classList.remove('show');
				});
				elementsArray[index].classList.add('currentSlide');
				elementsArray[index].querySelector('.buttonComp').classList.add('show');
				if (this.$route.name === 'index') {
					const tl = new TimelineMax({ paused: true });
					Array.from(elementsArray[index].querySelectorAll('.letter')).forEach((letter, i) => {
						tl.fromTo(letter, 0.5, {
							y: 0
						}, {
							y: i * this.offset
						}, i * 0.04);
					});
					tl.play();
				}
			}
		},
		'$store.getters.viewportSize': function() {
			this.onWindowResize();
		},
		'$store.getters.mousePositionPercent': function(position) {
			if (this.canSlide && this.canInteract) {
				if (position.x > 100 - this.navigationArrowsAreaWidth) {
					this.navigationIndicationSlideLeft();
				} else if (position.x < this.navigationArrowsAreaWidth) {
					this.navigationIndicationSlideRight();
				} else {
					this.navigationIndicationSlideReset();
				}
			}
		},
		'height': function() {
			this.onWindowResize();
		},
		'$route': function(to) {
			this.initRotation(to);
		},
		'$store.getters.pageIsMounted': function() {
			this.transitionTitle();
		}
	},

	mounted() {
		this.initThreeScene();
		this.addEventListeners();
		this.canSlide = this.$route.name === 'index';
		this.height = this.vh;
		this.initRotation(this.$route);
	},

	beforeDestroy() {
		this.removeEventListeners();
	},

	methods: {
		transitionTitle() {
			const mounted = this.$store.getters.pageIsMounted;
			if (mounted === true) {
				const duration = 1.3;
				const letterDuration = 0.5;
				if (this.$route.name === 'page') {
					const tl = new TimelineMax({ paused: true });
					tl.fromTo(this.$el, duration, {
						'--mask': 0
					}, {
						'--mask': 50,
						ease: Power4.easeOut,
						pointerEvents: 'none'
					})
					.to(this.$refs.nav.querySelectorAll('.left, .right'), duration / 3, {
						opacity: 0,
						pointerEvents: 'none'
					}, 0)
					.fromTo(this.$el.querySelector('.currentSlide .pagination'), duration / 5, {
						opacity: 1
					}, {
						opacity: 0,
						pointerEvents: 'none'
					}, 0)
					.fromTo(this.$el.querySelector('.currentSlide'), duration, {
						'--x-offset': this.items[this.currentSlide].position.x
					}, {
						'--x-offset': 5,
						ease: Power4.easeOut
					}, 0)
					.fromTo(this.$el.querySelector('.currentSlide .img'), duration, {
						'--imgTop': 45
					}, {
						'--imgTop': 40,
						ease: Power4.easeOut
					}, 0);
					Array.from(this.$el.querySelectorAll('.currentSlide .letter')).forEach((letter, i) => {
						tl.fromTo(letter, letterDuration, {
							y: i * this.offset
						}, {
							y: i * this.offset - this.vh * 0.15
						}, i * letterDuration / 16.5);
					});
					tl
					.fromTo(this.$el.querySelector('.currentSlide .subtitle'), duration / 5, {
						opacity: 1
					}, {
						opacity: 0,
						pointerEvents: 'none'
					}, 0)
					.fromTo(this.$el.querySelector('.currentSlide .callToAction'), duration / 5, {
						opacity: 1
					}, {
						opacity: 0,
						pointerEvents: 'none'
					}, 0);
					tl.play();
				} else if (this.$route.name === 'index') {
					const tl = new TimelineMax({ paused: true });
					tl.to(this.$el, duration, {
						'--mask': 0,
						ease: Power4.easeOut,
						pointerEvents: 'all'
					})
					.to(this.$refs.nav.querySelectorAll('.left, .right'), duration / 3, {
						opacity: 1,
						pointerEvents: 'all'
					}, 0);
					Array.from(this.$el.querySelectorAll('.selectorItem')).forEach((item, i) => {
						tl.to(item, duration, {
							'--x-offset': this.items[i].position.x,
							ease: Power4.easeOut
						}, 0);
					});
					tl.to(this.$el.querySelectorAll('.img'), duration, {
						'--imgTop': 45,
						ease: Power4.easeOut
					}, 0);
					const letters = Array.from(this.$el.querySelectorAll('.currentSlide .letter')).reverse();
					letters.forEach((letter, i) => {
						tl.to(letter, letterDuration, {
							y: (letters.length - i) * this.offset
						}, i * letterDuration / 16.5);
					});
					tl
					.to(this.$el.querySelectorAll('.pagination'), duration / 3, {
						opacity: 1,
						pointerEvents: 'all'
					}, '-=' + duration / 3)
					.to(this.$el.querySelectorAll('.subtitle'), duration / 3, {
						opacity: 1,
						pointerEvents: 'all'
					})
					.set(this.$el.querySelectorAll('.callToAction'), {
						opacity: 1,
						pointerEvents: 'all'
					}, 0);
					tl.play();
				}
			}
		},
		initRotation(route) {
			if (route.name === 'page') {
				const index = this.$t('categories.items').findIndex(i => i.slug === route.params.slug);
				this.rotation = (this.items.length - index) * this.rotationStep;
				this.$store.dispatch('updateCurrentSlide', index);
			}
		},
		addEventListeners() {
			window.addEventListener('keydown', this.keyboardEvent);
		},
		removeEventListeners() {
			window.removeEventListener('keydown', this.keyboardEvent);
		},
		keyboardEvent(event) {
			switch (event.key) {
				case 'ArrowLeft':
					this.prev();
					break;
				case 'ArrowRight':
					this.next();
					break;
			}
		},
		navigationIndicationSlideLeft() {
			TweenMax.to(this, 1.2, {
				directionalRotation: {
					useRadians: true,
					rotation: ((this.numberOfItems - this.currentSlide) * this.rotationStep) - (this.rotationStep * this.navigationIndicationSlide) + '_short'
				},
				ease: Power2.easeOut
			});
		},
		navigationIndicationSlideRight() {
			TweenMax.to(this, 1.2, {
				directionalRotation: {
					useRadians: true,
					rotation: ((this.numberOfItems - this.currentSlide) * this.rotationStep) + (this.rotationStep * this.navigationIndicationSlide) + '_short'
				},
				ease: Power2.easeOut
			});
		},
		navigationIndicationSlideReset() {
			TweenMax.to(this, 1.2, {
				directionalRotation: {
					useRadians: true,
					rotation: (this.numberOfItems - this.currentSlide) * this.rotationStep + '_short'
				},
				ease: Power2.easeOut
			});
		},
		panGesture(e) {
			if (this.canInteract) {
				if (e.isFinal) {
					this.canSlide = true;
					this.cursor = '-webkit-grab';
					switch (e.offsetDirection) {
						case 2:
							this.next();
							break;
						case 4:
							this.prev();
							break;
					}
				} else {
					this.canSlide = false;
					this.cursor = '-webkit-grabbing';
					switch (e.offsetDirection) {
						case 2:
							this.navigationIndicationSlideLeft();
							break;
						case 4:
							this.navigationIndicationSlideRight();
							break;
					}
				}
			}
		},
		spinAnimation() {
			return new Promise(resolve => {
				TweenMax.fromTo(this, 3.5, {
					rotation: Math.PI * 1.5
				}, {
					directionalRotation: {
						useRadians: true,
						rotation: '0_ccw'
					},
					ease: Power4.easeOut,
					onComplete: () => {
						this.backgroundTransitionDuration = 0.4;
						this.canSlide = true;
						resolve();
					}
				});
			});
		},
		leaveAnimationTween() {
			return TweenMax.to(this.$el, 1, {
				'height': this.vh / 2,
				ease: Power4.easeOut
			});
		},
		initThreeScene() {
			this.camera = new THREE.PerspectiveCamera(this.fov, window.innerWidth / window.innerHeight, 1, 1000);
			this.camera.position.set(0, 0, this.apothem);
			this.scene = new THREE.Scene();
			this.group = new THREE.Group();
			this.scene.add(this.group);
			this.renderer = new THREE.CSS3DRenderer();
			this.renderer.setSize(window.innerWidth, window.innerHeight);

			this.items.forEach((item, i) => {
				const x = this.apothem * Math.sin(i * Math.PI * 2 / this.numberOfItems);
				const y = 0;
				const z = -(this.apothem * Math.cos(i * Math.PI * 2 / this.numberOfItems) - this.apothem);
				const ry = -i * (Math.PI * 2 / this.numberOfItems);
				this.group.add(this.createElement(this.$refs.items[i], x, y, z, ry));
			});

			this.renderer.domElement.classList.add('threeDselector');

			this.$el.appendChild(this.renderer.domElement);
			this.animate();

			this.$el.querySelector('.threeDselector .selectorItem').classList.add('currentSlide');
			this.$el.querySelector('.threeDselector .selectorItem').querySelector('.buttonComp').classList.add('show');
		},
		prev() {
			if (this.canSlide && this.canInteract) {
				this.canSlide = false;
				const newRotation = ((this.numberOfItems - this.currentSlide) * this.rotationStep) + this.rotationStep;
				this.$store.dispatch('updateCurrentSlide', (this.currentSlide - 1) < 0 ? this.items.length - 1 : this.currentSlide - 1);
				this.slide(newRotation);
			}
		},
		next() {
			if (this.canSlide && this.canInteract) {
				this.canSlide = false;
				const newRotation = ((this.numberOfItems - this.currentSlide) * this.rotationStep) - this.rotationStep;
				this.$store.dispatch('updateCurrentSlide', (this.currentSlide + 1) > this.items.length - 1 ? 0 : this.currentSlide + 1);
				this.slide(newRotation);
			}
		},
		slide(to) {
			this.backgroundTransitionDuration = 0.4;
			return new Promise(resolve => {
				const tl = new TimelineMax({
					paused: true,
					onComplete: () => {
						this.canSlide = true;
						resolve();
					}
				});
				tl
				.to(this, this.transitionSpeed, {
					directionalRotation: {
						useRadians: true,
						rotation: to + '_short'
					},
					ease: Power4.easeOut
				})
				;
				tl.play();
			});
		},
		onWindowResize() {
			this.camera.aspect = window.innerWidth / window.innerHeight;
			this.camera.fov = this.fov;

			this.camera.updateProjectionMatrix();
			this.camera.position.set(0, 0, this.apothem);
			this.renderer.setSize(this.vw, this.vh);
			this.group.children.forEach((object, i) => {
				const x = this.apothem * Math.sin(i * Math.PI * 2 / this.numberOfItems);
				const y = 0;
				const z = -(this.apothem * Math.cos(i * Math.PI * 2 / this.numberOfItems) - this.apothem);
				object.position.set(x, y, z);
			});
		},
		createElement(div, x, y, z, ry) {
			const object = new THREE.CSS3DObject(div);
			object.position.set(x, y, z);
			object.rotation.y = ry;
			return object;
		},
		animate() {
			requestAnimationFrame(this.animate);
			this.camera.rotation.y = this.rotation;
			if (this.$store.getters.scrollPosition.y < this.vh * 1.2) {
				this.render();
			}
		},
		render() {
			this.renderer.render(this.scene, this.camera);
		},
		mod(n, m) {
			return ((n % m) + m) % m;
		}
	},

	components: {
		buttonComp,
		BigTitleComp
	}
};
</script>


<style lang="scss">
.selector {
	height: 100vh;
	width: var(--vw);
	--mask: 0;
	--page-transition-duration: 1s;
	position: relative;
	cursor: grab;
	z-index: 1;
	.background {
		transition: background-color var(--background-transition-duration);
		background-color: var(--current-color);
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		clip-path: polygon(0% 0%, 100% 0%, 100% calc(100% - var(--mask) * 1%), 0% calc(100% - var(--mask) * 0.55%));
	}
	.nav {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		pointer-events: none;
		z-index: 1;
		.left, .right {
			position: absolute;
			left: 0;
			top: 0;
			height: 100%;
			width: var(--navigation-arrows-area-width);
			pointer-events: all;
			cursor: w-resize;
			display: flex;
			align-items: flex-end;
			justify-content: flex-start;
			padding: 7vh 5vw;
			box-sizing: border-box;
		}
		.right {
			left: auto;
			right: 0;
			justify-content: flex-end;
			cursor: e-resize;
			img {
				transform: scale(-1);
			}
		}
	}
	.hiddenSelector {
		display: none;
	}
	.threeDselector .selectorItem {
		position: relative;
		height: var(--vh);
		width: var(--vw);
		display: flex;
		justify-content: center;
		align-items: center;
		flex-direction: column;
		transform-style: preserve-3d;
		.itemWrapper {
			position: relative;
			z-index: 3;
			.img {
				position: absolute;
				--imgTop: 45;
				top: calc(var(--imgTop) * 1%);
				left: 50%;
				transform: translate(-50%, -50%);
				img {
					transform: translate(calc(var(--x-offset) * 10% + var(--eased-mouse-position-percent-x) * 0.01%), calc(var(--y-offset) * 10% + var(--eased-mouse-position-percent-y) * 0.01%)) translateZ(0);
					z-index: 1;
					height: auto;
					width: 72vmin;
					height: 72vmin;
					object-fit: contain;
					display: block;
					filter: grayscale(1);
					transform-style: preserve-3d;
					pointer-events: none;
					position: relative;
					&.shadow {
						position: absolute;
						top: 50%;
						left: 50%;
						filter: grayscale(1) brightness(0);
						opacity: 0.15;
						transform: translate(calc(-50% + ((var(--x-offset) * 1% + var(--x-shadow-offset)) * 10) + (var(--eased-mouse-position-percent-x) * 0.02%)), calc(-50% + ((var(--y-offset) * 1% + var(--y-shadow-offset)) * 10) + (var(--eased-mouse-position-percent-y) * 0.02%))) scale(1.02) translateZ(0);
					}
				}
			}
			.titleWrapper {
				.pagination {
					position: absolute;
					left: 0;
					top: calc(5%);
					font-size: 1.2rem;
					transform-style: preserve-3d;
					font-weight: normal;
					font-family: 'Antonio';
					.current {
						font-size: 1.3em;
						font-weight: bold;
						transform: translateY(-10%);
					}
					.slash {
						margin: 0 0.3em;
					}
				}
			}
			.subtitle {
				position: absolute;
				right: 0;
				top: calc(48% + var(--title-top-offset) / 2 + ((-2% * var(--number-of-letters)) + 28%));
				color: white;
				clip-path: polygon(0 15%, 100% 0, 100% 100%, 0 100%);
				@supports (-ms-ime-align: auto) {
					&:after {
						content: '';
						position: absolute;
						transition: background-color var(--background-transition-duration);
						background-color: var(--current-color);
						bottom: 100%;
						left: 50%;
						height: 150%;
						width: 150%;
						transform: rotate(-6deg) translateX(-50%);
					}
				}
				h3 {
					display: block;
					transform: translateY(-150%);
					transition: transform 0.5s var(--ease);
					font-size: 1rem;
					span {
						font-size: 1.3em;
					}
				}
			}
		}

		.callToAction {
			position: absolute;
			bottom: 10%;
			z-index: 4;
			user-select: initial;
			.buttonWrapper {
				--buttonColor: var(--background-color);
			}
		}
		.buttonComp {
			--transition-delay: var(--transition-speed);
		}
	}

	&.canAnimate {
		.selectorItem {
			.itemWrapper {
				&:hover {
					.subtitle {
						h3 {
							transform: none;
						}
					}
				}
			}
		}
	}
}

</style>
