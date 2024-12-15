const ANIMATION_OPTIONS = [
  { value: 'none', label: 'None' },
  { value: 'wave', label: 'Wave!' }
];

interface AnimationCardProps {
  onAnimationChange: (value: string) => void;
}

export const AnimationCard = ({ onAnimationChange }: AnimationCardProps) => {
  return (
    <div className="w-full">
      <select 
        className="w-full px-3 py-2 rounded-lg glass-effect text-sm"
        onChange={(e) => onAnimationChange(e.target.value)}
        defaultValue=""
      >
        <option value="" disabled>Select animation</option>
        {ANIMATION_OPTIONS.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}; 