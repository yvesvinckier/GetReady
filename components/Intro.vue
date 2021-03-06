<template>
	<div :class="['intro', 'step__' + step]" :style="{'--lastColor': lastColor}" @click.shift="goToNextStep">
		<div class="step step0" ref="step0">
			<div class="loader" ref="loader" @complete="onLoaderComplete" @DOMLoaded="playLoader"></div>
		</div>
		<div :class="['step', 'step1']" ref="step1">
			<div class="sentences">
				<div class="sentence" v-for="i in 3" :key="i" ref="sentences">
					<span v-for="(word, j) in $t('intro.step1.sentences.' + i).split(' ')" :key="j">{{ word }} </span>
				</div>
			</div>
			<div :class="['button__next']" @click="goToStep(2)">
				<button-comp :text="$t('next')" ref="step1__button"></button-comp>
			</div>
		</div>
		<div :class="['step', 'step2']" ref="step2" :style="{'--cardsLeftMargin': cardsLeftMargin}">
			<div class="cards" ref="cardsWrapper">
				<div class="heading">
					<span v-for="(word, i) in $t('intro.step2.sidePanel.heading').split(' ')" :key="i">{{ word }} </span>
				</div>
				<ul v-hammer:pan.horizontal="panGesture" ref="cardsList">
					<li :class="['card', (cards.length - 1 - i) === currentCardIndex ? 'selected': '']" v-for="(card, i) in cards.slice().reverse()" ref="cards" :key="card.title + (cards.length - 1 - i)">
						<card-comp :item="card"></card-comp>
					</li>
				</ul>
				<div class="nav" ref="cardsNav">
					<div class="arrow left">
						<div class="arrowWrapper" @click="prevCard">
							<img src="~/assets/images/arrow.svg" ref="cardsArrowLeft"/>
						</div>
					</div>
					<div class="dots">
						<span :class="['dot', i === currentCardIndex ? 'selected' : '']" v-for="(card, i) in cards" :key="i" @click="goToCard(i)"></span>
					</div>
					<div class="arrow right">
						<div class="arrowWrapper" @click="nextCard">
							<img src="~/assets/images/arrow.svg" ref="cardsArrowRight"/>
						</div>
						<div :class="['button__next']" @click="goToStep(3)">
							<button-comp :text="$t('next')" ref="step2__button"></button-comp>
						</div>
					</div>
				</div>
			</div>
			<div class="formPanel" ref="formPanel">
				<div class="wrapper">
					<span class="subheading" v-t="'intro.step2.formPanel.subheading'" ref="formSubheading"></span>
					<h2 v-t="'intro.step2.formPanel.heading'" ref="formHeading"></h2>
					<p v-t="'intro.step2.formPanel.text'" ref="formText"></p>
					<form @submit.prevent="validate">
						<input type="text" :placeholder="$t('intro.step2.formPanel.placeholder')" ref="goalInput">
						<div class="examples" ref="formExamples">
							<span v-t="'intro.step2.formPanel.Example'"></span>
							<div class="wrapper">
								<ul>
									<li v-for="(example, i) in examples" v-html="example" :key="i"></li>
								</ul>
							</div>
						</div>
						<div class="buttons" @click="validate">
							<button-comp :text="$t('intro.step2.formPanel.submit')" ref="formButton"></button-comp>
						</div>
					</form>
				</div>
			</div>
		</div>
		<div class="step step4" ref="step4">
			<div class="goal h2" ref="step4__goal">{{ $store.getters.goal }}</div>
			<div class="texts">
				<div class="text">
					<div class="illustration" ref="step4__illu1">
						<img :src="PATH + $t('intro.step4.img1')" alt="">
					</div>
					<p ref="step4__text1" v-t="'intro.step4.text1'"></p>
				</div>
				<div class="text">
					<div class="illustration" ref="step4__illu2">
						<summary-card-indicator-comp color="white"></summary-card-indicator-comp>
					</div>
					<p ref="step4__text2" v-html="$t('intro.step4.text2').replace(':edit-icon:', editIcon).replace(':save-icon:', saveIcon)"></p>
				</div>
			</div>
			<div class="button__next" @click="endIntro">
				<button-comp :text="$t('Understood')" ref="step4__button"></button-comp>
			</div>
		</div>
	</div>
</template>
<script>
import ButtonComp from '~/components/Button';
import CardComp from '~/components/Card';
import SummaryCardIndicatorComp from '~/components/SummaryCardIndicator';
import lottie from 'lottie-web';
const loaderData = require('~/core/loader.json');
export default {
	props: {
		lastColor: {
			default: 'blue'
		}
	},
	data() {
		return {
			step: 0,
			cardsTranslationDuration: '1000',
			currentCardIndex: 0,
			cardDirection: -1,
			allCardsAreDisplayed: false,
			cardsLeftMargin: '20%',
			cards: Object.values(this.$t('cards')),
			examples: [
				this.$t('intro.step2.formPanel.examples.1'),
				this.$t('intro.step2.formPanel.examples.2')
			],
			PATH: process.env.PATH,
			editIcon: '<svg class="editIcon icon" width="14" height="14" viewBox="0 0 14 14"><path fill-rule="nonzero" d="M10.285.003a.522.522 0 0 0-.307.15L1.014 9.118a.52.52 0 0 0-.14.248l-.862 3.792a.527.527 0 0 0 .139.481.527.527 0 0 0 .48.139l3.793-.862a.52.52 0 0 0 .253-.14l8.964-8.964a.537.537 0 0 0 0-.727L10.71.154a.525.525 0 0 0-.426-.151zm.06 1.244l2.197 2.204-.991.99-2.198-2.197.991-.997zM8.62 2.971l2.198 2.203-6.335 6.335-2.197-2.198 6.334-6.34zm-6.878 7.256l1.826 1.826-2.36.533.534-2.359z"/></svg>',
			saveIcon: '<svg class="saveIcon" width="12" height="15" viewBox="0 0 12 15"><g fill="#5781F8" fill-rule="nonzero"><path d="M9.174.287H.23v14.426h11.54V2.883L9.174.288zm1.154 12.983H1.672V1.73h1.443v1.442h1.442V1.73H6v1.442h1.443V1.73h1.154l1.73 1.73v9.81z"/><path d="M5.292 8.985L4.21 7.83 3.2 8.84l2.092 2.163L8.97 7.326l-1.01-1.01z"/></g></svg>'
		};
	},
	watch: {
		'step': function(step) {
			switch (step) {
				case 1:
					this.animateStep1();
					break;
				case 2:
					this.animateStep2();
					break;
				case 3:
					this.animateStep3();
					break;
				case 4:
					this.animateStep4();
					break;
			}
		},
		'currentCardIndex': function(currentCardIndex, prevCardIndex) {
			this.allCardsAreDisplayed = currentCardIndex === this.cards.length - 1;
			const tl = new TimelineMax({
				paused: true
			});
			const prevCard = this.$refs.cards[this.cards.length - 1 - prevCardIndex];
			const nextCard = this.$refs.cards[this.cards.length - 1 - currentCardIndex];
			TweenMax.set(nextCard, {
				zIndex: 2
			});

			const duration = 0.3;

			tl
			.set(nextCard, {
				rotation: 0
			})
			.to(prevCard, duration, {
				xPercent: this.cardDirection === 1 ? 80 : -180,
				x: 0,
				yPercent: -30,
				y: 0,
				transformOrigin: 'bottom',
				rotation: this.cardDirection === 1 ? 15 : -15,
				'--cardBoxShadowOpacity': 0.09,
				ease: Power4.easeOut
			})
			.set(prevCard, {
				zIndex: 1
			}, duration / 2)
			.set(nextCard, {
				zIndex: 3
			}, duration / 2)
			.to(prevCard, 0.4, {
				xPercent: -50,
				x: 0,
				yPercent: -50,
				y: 0,
				'--cardBoxShadowOpacity': 0,
				rotation: Math.floor(Math.random() * 4) + 1,
				ease: Power4.easeInOut
			})
			;
			tl.play();
		},
		'allCardsAreDisplayed': function(allDisplayed) {
			if (allDisplayed) {
				const tl = new TimelineMax({ paused: true });
				tl
				.to(this.$refs.cardsArrowRight, 0.2, {
					opacity: 0,
					pointerEvents: 'none'
				})
				.add(() => {
					this.$refs.step2__button.show = true;
				});
				tl.play();
			}
		}
	},
	mounted() {
		this.animateStep0();
	},
	methods: {
		goToStep(index) {
			this.step = index;
		},

		animateStep0() {
			this.loader = lottie.loadAnimation({
				container: this.$refs.loader,
				renderer: 'svg',
				loop: false,
				autoplay: false,
				animationData: loaderData
			});
			this.loader.addEventListener('complete', this.onLoaderComplete.bind(this));
			this.loader.addEventListener('DOMLoaded', this.playLoader.bind(this));
		},

		onLoaderComplete() {
			setTimeout(() => {
				this.goToStep(1);
			}, 1000);
		},

		playLoader() {
			setTimeout(() => {
				this.loader.play();
			}, 700);
		},

		animateStep1() {
			const tl = new TimelineMax({ paused: true });
			const duration = 1;
			tl
			.to(this.$refs.step0, 0.4, {
				opacity: 0,
				scale: 0.97,
				pointerEvents: 'none'
			})
			.set(this.$refs.step1, {
				opacity: 1,
				scale: 1,
				pointerEvents: 'all'
			})
			.staggerTo([this.$refs.sentences[0], this.$refs.sentences[1]], duration, {
				opacity: 1,
				yPercent: 0,
				rotation: '0deg',
				ease: Power4.easeOut
			}, 0.2, '-=0.2')
			.to(this.$refs.sentences[2], duration, {
				opacity: 1,
				yPercent: 0,
				rotation: '0deg',
				ease: Power4.easeOut
			}, '+=0.3')
			.add(() => {
				this.$refs.step1__button.show = true;
			});

			tl.play();
		},

		animateStep2() {
			return new Promise(resolve => {
				const tl = new TimelineMax({ paused: true, onComplete: resolve, delay: 0.5 });
				tl
				.to(this.$refs.step1, 0.4, {
					opacity: 0,
					scale: 0.97,
					pointerEvents: 'none'
				})
				.set(this.$refs.step2, {
					opacity: 1,
					scale: 1,
					pointerEvents: 'all'
				})
				.staggerFrom(this.$refs.step2.querySelectorAll('.heading span'), 1.2, {
					yPercent: 10,
					rotation: '4deg',
					opacity: 0,
					ease: Power4.easeOut
				}, 0.1)
				.staggerFrom(this.$refs.cards, 0.6, {
					x: this.$store.getters.viewportSize.width / 1.5,
					y: '6vh',
					rotation: '15deg',
					ease: Power4.easeOut
				}, 0.1, '-=0.3')
				.to(this.$refs.cardsList, 0.3, {
					'--boxShadowOpacity': 0.09
				})
				.add('navMarker')
				.staggerFrom(this.$refs.step2.querySelectorAll('.dot'), 1, {
					yPercent: 10,
					opacity: 0,
					ease: Power4.easeOut
				}, 0.1, 'navMarker')
				.from(this.$refs.step2.querySelectorAll('.arrow'), 1, {
					yPercent: 10,
					opacity: 0,
					ease: Power4.easeOut
				}, 'navMarker')
				;
				tl.play();
			});
		},

		animateStep3() {
			return new Promise(resolve => {
				const tl = new TimelineMax({ paused: true, onComplete: resolve });
				const formElements = [
					this.$refs.formSubheading,
					this.$refs.formHeading,
					this.$refs.formText,
					this.$refs.goalInput,
					this.$refs.formExamples
				];

				tl
				.to([this.$refs.cardsNav.querySelectorAll('.arrow'), this.$refs.cardsWrapper.querySelector('.heading')], 0.3, {
					opacity: 0,
					pointerEvents: 'none'
				})
				.add(() => {
					this.$refs.step2__button.show = false;
				})
				.set(this.$refs.cardsNav.querySelectorAll('.arrow'), {
					position: 'relative',
					x: 0,
					y: 0,
					xPercent: 0,
					yPercent: 0,
					top: 'auto',
					left: 'auto',
					right: 'auto',
					bottom: 'auto'
				})
				.set(this.$refs.cardsNav, {
					justifyContent: 'space-between'
				})
				.set(this.$refs.formPanel, {
					opacity: 1,
					pointerEvents: 'all'
				})
				.set(formElements, {
					transformOrigin: 'center right'
				})
				.to(this.$refs.cardsWrapper, 1, {
					left: this.cardsLeftMargin,
					xPercent: 0,
					x: 0,
					ease: Power4.easeInOut
				}, '-=0.3')
				.to(this.$refs.cardsNav.querySelectorAll('.arrow, .arrowWrapper img'), 0.4, {
					opacity: 1,
					pointerEvents: 'all'
				})
				.staggerFrom(formElements, 1, {
					opacity: 0,
					rotation: '-1.5deg',
					ease: Power4.easeOut
				}, 0.2, '-=0.5')
				.add(() => {
					this.$refs.formButton.show = true;
				})
				;

				tl.play();
			});
		},

		animateStep4() {
			return new Promise(resolve => {
				const tl = new TimelineMax({ paused: true, onComplete: resolve, delay: 0.5 });
				tl
				.to(this.$refs.step2, 0.4, {
					opacity: 0,
					scale: 0.97,
					pointerEvents: 'none'
				})
				.set(this.$refs.step4, {
					opacity: 1,
					scale: 1,
					pointerEvents: 'all'
				})
				.fromTo(this.$refs.step4__goal, 0.7, {
					opacity: 0,
					yPercent: 10,
					rotation: '-4deg'
				}, {
					opacity: 1,
					yPercent: 0,
					rotation: '0deg',
					ease: Power4.easeOut
				})
				.staggerFromTo([this.$refs.step4__illu1, this.$refs.step4__illu2], 1, {
					opacity: 0,
					yPercent: 50
				}, {
					yPercent: 0,
					opacity: 1,
					ease: Power4.easeOut
				}, 0.1, '-=0.3')
				.staggerFromTo([this.$refs.step4__text1, this.$refs.step4__text2], 1, {
					opacity: 0,
					yPercent: 50
				}, {
					yPercent: 0,
					opacity: 1,
					ease: Power4.easeOut
				}, 0.1, '-=0.9')
				.to(this.$refs.step4, 0.8, {
					'--step4-line-scale': 1,
					ease: Power4.easeOut
				}, '-=0.4')
				.add(() => {
					this.$refs.step4__button.show = true;
				}, '-=0.2');
				tl.play();
			});
		},

		goToNextStep() {
			const nextStep = this.step + 1 > 2 ? 0 : this.step + 1;
			this.goToStep(nextStep);
		},

		goToCard(i) {
			this.currentCardIndex = i;
		},

		getCardZIndex(i, currentCardIndex) {
			const value = (this.cards.length - i) + (currentCardIndex) - 1;
			const zIndex = value % this.cards.length;
			return zIndex;
		},

		panGesture(e) {
			if (e.isFinal) {
				this.nextCard();
			} else {
				switch (e.offsetDirection) {
					case 2:
						this.cardDirection = -1;
						this.cardSlideLeft();
						break;
					case 4:
						this.cardDirection = 1;
						this.cardSlideRight();
						break;
				}
			}
		},

		nextCard() {
			this.goToCard(this.currentCardIndex + 1 < this.cards.length ? this.currentCardIndex + 1 : 0);
		},

		prevCard() {
			this.goToCard(this.currentCardIndex - 1 > -1 ? this.currentCardIndex - 1 : this.cards.length - 1);
		},

		cardSlideLeft() {
			const card = this.$refs.cards[this.cards.length - 1 - this.currentCardIndex];
			const nextIndex = (this.cards.length - 1 - (this.currentCardIndex + 1));
			const nextCard = this.$refs.cards[(nextIndex) < 0 ? this.cards.length - 1 : nextIndex];
			TweenMax.set(card, {
				zIndex: 3
			}, 0);
			TweenMax.set(nextCard, {
				rotation: 0,
				zIndex: 2
			}, 0);
			TweenMax
			.to(card, 0.5, {
				xPercent: -180,
				x: 0,
				yPercent: -30,
				y: 0,
				transformOrigin: 'bottom',
				rotation: -15,
				'--cardBoxShadowOpacity': 0.09,
				ease: Power4.easeOut
			});
		},

		cardSlideRight() {
			const card = this.$refs.cards[this.cards.length - 1 - this.currentCardIndex];
			const nextIndex = (this.cards.length - 1 - (this.currentCardIndex + 1));
			const nextCard = this.$refs.cards[(nextIndex) < 0 ? this.cards.length - 1 : nextIndex];
			TweenMax.set(card, {
				zIndex: 3
			}, 0);
			TweenMax.set(nextCard, {
				rotation: 0,
				zIndex: 2
			}, 0);
			TweenMax
			.to(card, 0.5, {
				xPercent: 80,
				x: 0,
				yPercent: -30,
				y: 0,
				transformOrigin: 'bottom',
				rotation: 15,
				'--cardBoxShadowOpacity': 0.09,
				ease: Power4.easeOut
			});
		},

		validate(event) {
			event.preventDefault();
			this.$store.dispatch('setGoal', this.$refs.goalInput.value);
			this.goToStep(4);
		},

		endIntro() {
			this.$router.push('/');
		}
	},
	components: {
		ButtonComp,
		CardComp,
		SummaryCardIndicatorComp
	}
};
</script>


<style lang="scss">
.intro {
	height: 100vh;
	width: 100vw;
	background: var(--intro-blue);
	--stepTransitionDuration: 0.7s;
	color: white;
	position: relative;
	--maskYLeft: 100;
	--maskYRight: 100;
	overflow: hidden;
	&:after {
		content: '';
		position: absolute;
		top: 0;
		right: 0;
		bottom: 0;
		left: 0;
		clip-path: polygon(0% calc(1% * var(--maskYLeft)), 100%  calc(1% * var(--maskYRight)), 100% 100%, 0% 100%);
		background: var(--lastColor);
	}
	.button__next {
		position: absolute;
		bottom: 10%;
		left: 50%;
		transform: translateX(-50%);
		.buttonWrapper {
			--buttonColor: var(--light-blue);
		}
	}
	.step {
		position: absolute;
		top: 0;
		right: 0;
		bottom: 0;
		left: 0;
		height: 100%;
		width: 100%;
		transform: scale(0.97);
		opacity: 0;
		pointer-events: none;
	}
	.step0 {
		opacity: 1;
		pointer-events: all;
		transform: none;
		svg {
			width: 100%;
			height: 100%;
		}
	}
	.step1 {
		opacity: 0;
		pointer-events: none;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		.sentences {
			text-align: center;
			font-size: 1.6rem;
			line-height: 2;
			.sentence {
				transform-origin: center right;
				opacity: 0;
				transform: translateY(10%) rotate(-4deg);
				span {
					display: inline-block;
				}
				&:last-child {
					font-weight: 600;
				}
			}
		}
	}

	.step2 {
		position: relative;
		.cards {
			position: absolute;
			top: 50%;
			left: 50%;
			transform: translate(-50%, -50%);
			display: flex;
			flex-direction: column;
			align-items: center;
			z-index: 1;
			.heading {
				font-size: 1.22rem;
				margin-bottom: 2em;
				span {
					display: inline-block;
					transform-origin: center left;
				}
			}
			ul {
				display: block;
				z-index: 2;
				width: var(--card-width);
				height: calc(var(--card-width) * 1.54);
				position: relative;
				--boxShadowOpacity: 0;
				box-shadow: 0 calc(var(--card-width) * 0.03) calc(var(--card-width) * 0.07) rgba(0, 0, 0, var(--boxShadowOpacity));
				border-radius: calc(var(--card-width) / 15);
				.card {
					position: absolute;
					left: 50%;
					top: 50%;
					transform: translate(-50%, -50%) rotate(var(--cardRotate));
					.cardComp {
						border: solid 1px rgba(0, 0, 0, 0.07);
					}
					@for $i from 1 to 10 {
						&:nth-child(#{$i}) {
							--cardRotate: calc(#{random($limit: 8) - 4} * 1deg);
						}
					}
				}
			}
			.nav {
				display: flex;
				width: var(--card-width);
				justify-content: center;
				align-items: center;
				margin-top: 3rem;
				.arrow {
					cursor: pointer;
					position: absolute;
					top: 50%;
					transform: translateY(-50%);
					right: 150%;
					.arrowWrapper {
						height: 2.5rem;
						display: flex;
						align-items: center;
						justify-content: center;
					}
					&.right {
						right: auto;
						left: 150%;
						img {
							transform: scale(-1);
						}
					}
					.button__next {
						pointer-events: none;
						bottom: 50%;
						transform: translate(-50%, 50%);
					}
				}
				.dots {
					.dot {
						position: relative;
						width: 6px;
						height: 6px;
						display: inline-block;
						margin: 0 0.5em;
						cursor: pointer;
						transform: translateY(-50%);
						&:after {
							content: '';
							border: solid white 2px;
							border-radius: 50%;
							position: absolute;
							display: block;
							width: 0;
							height: 0;
							top: 50%;
							left: 50%;
							transform: translate(-50%, -50%);
							transition: all 0.2s;
						}
						&.selected {
							cursor: default;
							&:after {
								width: 100%;
								height: 100%;
							}
						}
					}
				}
			}
		}
		.formPanel {
			position: absolute;
			top: 0;
			left: 50%;
			bottom: 0;
			width: 50%;
			display: flex;
			justify-content: flex-start;
			align-items: center;
			pointer-events: none;
			opacity: 0;
			.wrapper {
				width: calc(100% - var(--cardsLeftMargin));
				text-align: left;
				.subheading {
					display: block;
					font-size: 1.3rem;
					text-transform: uppercase;
				}
				h2 {
					margin-top: 0;
					margin-bottom: 0;
					color: white !important;
				}
				p {
					display: inline-block;
					width: 66%;
					margin-bottom: 4rem;
					font-size: 1.1rem;
				}
				form {
					position: relative;
					input[type=text] {
						font-size: 2.5rem;
						width: 100%;
						font-family: 'Antonio';
						font-weight: 600;
						color: inherit;
						background: none;
						border: none;
						border-bottom: solid white 2px;
						padding: 0.1em;
						line-height: 1.5;
						color: var(--blue);
						&::placeholder {
							color: #6c85bc;
							font-weight: 600;
						}
					}
					.examples {
						display: inline-block;
						margin: 2rem 0;
						width: 100%;
						span {
							line-height: 1.5em;
						}
						.wrapper {
							margin-left: 1rem;
							vertical-align: top;
							display: inline-block;
							height: 1.5em;
							overflow: hidden;
							@keyframes slide {
								0%, 45% {
									transform: translateY(0%);
								}
								55%, 90% {
									transform: translateY(-50%);
								}
							}
							ul {
								animation: slide 10s infinite;
								li {
									font-size: 1rem;
									font-style: italic;
									white-space: nowrap;
								}
							}
						}
					}
					.buttons {
						.buttonWrapper {
							--buttonColor: var(--light-blue);
						}
					}
				}
			}
		}
	}

	.step4 {
		display: flex;
		justify-content: center;
		align-items: center;
		flex-direction: column;
		--step4-line-scale: 0;
		.goal{
			display: block;
			font-size: 2.5rem;
			margin-bottom: 1em;
			color: var(--blue);
			font-weight: 600;
		}
		.texts {
			display: flex;
			.text {
				font-size: 1rem;
				line-height: 1.67;
				text-align: center;
				max-width: 19.6em;
				padding: 1rem 2.6rem 0 0;
				position: relative;
				display: flex;
				flex-direction: column;
				align-items: center;
				line-height: 2;
				.illustration {
					margin-bottom: 2.5rem;
					width: calc(70% - 2.6rem);
					height: 6.1rem;
					img {
						width: 100%;
						height: 100%;
						object-fit: contain;
					}
					.summaryCardIndicator {
						width: 100%;
						height: 100%;
						.rotation {
							height: 100%;
							width: auto;
						}
						.eye {
							height: 15%;
							width: auto;
						}
					}
				}
				&:last-child {
					padding: 1rem 0 0 2.6rem;
					&:before {
						content: '';
						position: absolute;
						right: 100%;
						width: 1px;
						top: 1rem;
						height: 6rem;
						background-color: white;
						transform: scaleY(var(--step4-line-scale));
					}
				}
				p {
					svg {
						vertical-align: middle;
						display: inline;
						height: 1rem;
						width: auto;
						margin: 0 0.1rem;
						path {
							fill: var(--blue);
						}
					}
				}
			}
		}
	}
}
</style>
