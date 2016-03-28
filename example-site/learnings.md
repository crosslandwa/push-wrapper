# Web Audio API Learnings

Bits of information/weirdies I learned while creating the sample app. May read like the ramblings of a drugged horse...

## Envelopes

### Zero gain and exponential ramps

Cannot use a value of 0 for a gain node that you want to apply exponential ramp too!

Works:
```javascript
gain.setValueAtTime(0.001, now);
gain.exponentialRampToValueAtTime(1, now + 0.1);
```

Not Works!
```javascript
gain.setValueAtTime(0, now);
gain.exponentialRampToValueAtTime(1, now + 0.1);
```

Todo: try linear ramp off zero, then exponential ramp
```javascript
gain.setValueAtTime(0, now);
gain.linearRampToValueAtTime(0.001, now + 0.01);
gain.exponentialRampToValueAtTime(1, now + 0.99);
```

### Clicking when changing ramp direction

Cancelling a ramp, then ramping to zero clicked unless 'anchoring' ramp before scheduling change

Clicks:
```javascript
gain.cancelScheduledValues(now);
gain.linearRampToValueAtTime(0, now + 0.5);
```

Not clicks:
```javascript
gain.cancelScheduledValues(now);
gain.setValueAtTime(gain.value, now);
gain.linearRampToValueAtTime(0, now + 0.01);            
```